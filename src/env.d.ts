/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/cloudflare" />

// Cloudflare binding types (used via cloudflare:workers env import in v14+)
type D1Database = import('@cloudflare/workers-types').D1Database;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

// @astrojs/cloudflare v14: App.Locals.runtime only provides cfContext.
// Bindings (DB, SESSION, etc.) are accessed via:
//   const { env } = await import('cloudflare:workers');
//   const db = env.DB as D1Database;
declare namespace App {
	interface Locals {
		// runtime is provided by the adapter — only cfContext, NOT .env
		runtime: {
			cfContext: import('@cloudflare/workers-types').ExecutionContext;
		};
		user?: import('./lib/auth').SessionUser;
	}
}
