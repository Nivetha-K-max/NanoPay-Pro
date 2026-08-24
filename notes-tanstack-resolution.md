Observed error:

- Vite dependency optimization fails: could not resolve '#tanstack-router-entry' and '#tanstack-start-entry' in @tanstack/start-server-core.

Current state:
- vite.config.ts patched: removed vite-tsconfig-paths and enabled resolve.tsconfigPaths.
- Error persists, meaning the root cause is not tsconfig paths plugin.

Likely causes to investigate next:
1) TanStack Start expects a specific Vite plugin / environment for those virtual modules.
2) Version mismatch between Vite (8.0.16) and TanStack packages may be causing virtual specifiers not to be defined.
3) Node version (v24.11.1) might be beyond supported range for this TanStack/Vite combo.

Next steps (to execute):
- Inspect TanStack Start docs for correct Vite config for the used versions.
- Remove any conflicting plugins (other than TanStackRouterVite/react/tailwind).
- Try upgrading/downgrading @tanstack/router-plugin/@tanstack/react-start to a compatible set.
- Confirm node version compatibility (try Node 22+ only or pin to recommended version).

