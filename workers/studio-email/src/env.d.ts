/**
 * Wrangler secrets / bindings not listed in worker-configuration.d.ts [vars].
 * Run `npm run cf-typegen` after changing wrangler.toml.
 */
interface Env {
  STUDIO_EMAIL_SECRET: string
}
