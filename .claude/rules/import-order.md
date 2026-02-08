Imports are grouped by distance from the current file, separated by blank lines, with third-party (farthest) first and relative (closest) last:

1. **Third-party libraries** — `react-router`, `lucide-react`, `zod`, `drizzle-orm`, `@conform-to/*`, etc.
2. **Route types** — `./+types/*` or `../+types/*`
3. **App core** — `~/lib/*`, `~/database/*`, `~/utils-server/*`
4. **Shared components** — `~/components/*`
5. **Local/relative imports** — `./lib/*`, `../lib/*`, `./components/*`
