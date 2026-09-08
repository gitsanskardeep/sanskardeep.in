import { defineMiddleware } from 'astro:middleware';
import { getAdminSession, SESSION_COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const isPublicAdminRoute = 
      pathname === '/admin/login' || 
      pathname === '/admin/setup' || 
      pathname === '/admin/logout';

    const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;

    let activeUser = null;

    if (sessionCookie) {
      try {
        const { env } = await import('cloudflare:workers');
        const kv = (env as Record<string, unknown>).SESSION as import('@cloudflare/workers-types').KVNamespace | undefined;
        if (kv) {
          activeUser = await getAdminSession(kv, sessionCookie);
        }
      } catch (err) {
        console.warn('Middleware: cloudflare:workers SESSION lookup skipped or failed:', err);
      }
    }

    if (activeUser) {
      context.locals.user = activeUser;

      // If already logged in and visiting login or setup, redirect directly to dashboard
      if (pathname === '/admin/login' || pathname === '/admin/setup') {
        return context.redirect('/admin/downloads');
      }
    } else if (!isPublicAdminRoute) {
      // Unauthenticated visitor trying to access protected /admin route
      if (sessionCookie) {
        context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      }
      return context.redirect('/admin/login?err=' + encodeURIComponent('Please log in to access the admin portal.'));
    }
  }

  return next();
});
