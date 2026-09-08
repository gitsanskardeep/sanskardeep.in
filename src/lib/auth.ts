// Sanskar Deep - Secure Admin Authentication & Session Management
// Uses Web Crypto API (PBKDF2 with SHA-256) and Cloudflare SESSION KV

import type { AdminRecord } from '../db/schema';

type D1Database = import('@cloudflare/workers-types').D1Database;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

export const SESSION_COOKIE_NAME = 'sanskardeep_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  adminId: number;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: number;
}

export interface CreateFirstAdminDTO {
  email: string;
  password: string;
  fullName: string;
}

// ---------------------------------------------------------------------------
// 1. Password Hashing (Zero external dependencies, Web Crypto API)
// ---------------------------------------------------------------------------

/**
 * Hashes a plaintext password using PBKDF2 with SHA-256 and a 16-byte random salt.
 * Output format: pbkdf2:sha256:100000:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes (256 bits)
  );

  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:sha256:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a candidate password against a stored PBKDF2 hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') {
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const saltHex = parts[3];
    const expectedHashHex = parts[4];

    if (!iterations || !saltHex || !expectedHashHex) {
      return false;
    }

    const saltMatches = saltHex.match(/.{1,2}/g);
    if (!saltMatches) return false;
    const salt = new Uint8Array(saltMatches.map(b => parseInt(b, 16)));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const derivedHashHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe byte comparison
    if (derivedHashHex.length !== expectedHashHex.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < derivedHashHex.length; i++) {
      diff |= derivedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }

    return diff === 0;
  } catch (err) {
    console.error('Password verification failure:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2. Database Admin Lookups & Setup
// ---------------------------------------------------------------------------

/**
 * Checks how many active admin records exist in the D1 admins table.
 */
export async function countActiveAdmins(db: D1Database): Promise<number> {
  try {
    const result = await db.prepare(
      'SELECT count(*) as total FROM admins WHERE is_active = 1'
    ).first<{ total: number }>();

    return result?.total ?? 0;
  } catch (err) {
    console.warn('Failed to count admins in D1:', err);
    return 0;
  }
}

/**
 * Looks up an admin record by email.
 */
export async function getAdminByEmail(db: D1Database, email: string): Promise<AdminRecord | null> {
  try {
    const trimmed = email.trim().toLowerCase();
    const admin = await db.prepare(
      'SELECT * FROM admins WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1'
    ).bind(trimmed).first<AdminRecord>();

    return admin || null;
  } catch (err) {
    console.warn('Failed to fetch admin by email:', err);
    return null;
  }
}

/**
 * Creates the primary initial superadmin account.
 * Only succeeds if no active admin currently exists.
 */
export async function createFirstAdmin(
  db: D1Database,
  dto: CreateFirstAdminDTO
): Promise<{ success: boolean; error?: string; admin?: AdminRecord }> {
  try {
    const count = await countActiveAdmins(db);
    if (count > 0) {
      return { success: false, error: 'Initial setup is locked: an administrator account already exists.' };
    }

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters long.' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!dto.password || dto.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const passwordHash = await hashPassword(dto.password);

    const result = await db.prepare(`
      INSERT INTO admins (email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'superadmin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(email, passwordHash, fullName).run();

    if (!result.success) {
      return { success: false, error: 'Database error creating admin account.' };
    }

    const createdAdmin = await getAdminByEmail(db, email);
    return { success: true, admin: createdAdmin || undefined };
  } catch (err: any) {
    console.error('Error creating first admin:', err);
    return { success: false, error: err?.message || 'Failed to create admin.' };
  }
}

/**
 * Verifies email and password, returning the AdminRecord if valid.
 */
export async function verifyAdminCredentials(
  db: D1Database,
  email: string,
  password: string
): Promise<AdminRecord | null> {
  const admin = await getAdminByEmail(db, email);
  if (!admin || !admin.password_hash) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    return null;
  }

  return admin;
}

// ---------------------------------------------------------------------------
// 3. Server-side Session Management (SESSION KV)
// ---------------------------------------------------------------------------

/**
 * Creates a cryptographically random session token and stores the session in Cloudflare KV.
 */
export async function createAdminSession(kv: KVNamespace, admin: AdminRecord): Promise<string> {
  // 32 cryptographically secure random bytes = 64 hex chars
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const sessionId = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const sessionData: SessionUser = {
    adminId: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
    createdAt: Date.now()
  };

  await kv.put(`admin_session:${sessionId}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL_SECONDS
  });

  return sessionId;
}

/**
 * Validates a session token against SESSION KV and returns the active SessionUser.
 */
export async function getAdminSession(kv: KVNamespace, sessionId: string): Promise<SessionUser | null> {
  if (!sessionId || sessionId.length < 32) {
    return null;
  }

  try {
    const raw = await kv.get(`admin_session:${sessionId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed || !parsed.adminId || !parsed.email) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to read admin session from KV:', err);
    return null;
  }
}

/**
 * Destroys a session token in SESSION KV.
 */
export async function destroyAdminSession(kv: KVNamespace, sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    await kv.delete(`admin_session:${sessionId}`);
  } catch (err) {
    console.warn('Failed to delete admin session from KV:', err);
  }
}
