# Finway

Personal finance management app.

## Tech Stack

- **Frontend:** React 19, React Router v7 (Framework mode: SSR), Tailwind CSS v4, shadcn/ui (Radix UI), Recharts
- **Backend:** React router managed (Express v5, Node.js 22)
- **Database:** SQLite (LibSQL), Drizzle ORM
- **Validation:** Zod schemas, Conform for form handling
- **Auth:** Cookie-based sessions, magic link emails (Resend)
- **Language:** TypeScript 5.9, Vite 7

## Architecture

Server-rendered React app with Express. React Router v7 handles routing, SSR, and data loading.

```
app/
  routes/          - Feature-based route modules (accounts, transactions, credit-cards, etc.)
  components/ui/   - shadcn/ui primitives
  components/      - Shared components (forms, theme toggle, toasts)
  layouts/         - Private (sidebar nav) and public (login) layouts
  middleware/      - Auth middleware
  lib/             - Context providers (db, user, global), types, utils
  utils-server/    - Server-only utilities (auth, env, email, toast, theme, honeypot)
  database/        - Drizzle schema and seed data
  emails/          - React Email templates
server/app.ts      - Express server setup with middleware stack
```

## Key Patterns

- **Data flow:** `loader()` for reads, `action()` for mutations — server-centric, progressive enhancement
- **Database context:** Drizzle `db` instance injected via `RouterContextProvider`, accessed in loaders/actions
- **Auth:** `requireAuthenticated()` / `requireAnonymous()` guards in loaders/actions; user set via `userContext`
- **Forms:** Conform + Zod schemas for validation on both client and server; `parseWithZod` in actions
- **Styling:** Tailwind CSS v4 with CSS variables for light/dark theming; CVA for component variants
- **IDs:** CUID2 primary keys, cascade deletes on foreign keys
- **Security:** Helmet (CSP with nonce), rate limiting, honeypot fields
- **Import alias:** `~/` maps to `app/`

## Commands

```sh
pnpm dev          # Dev server
pnpm build        # Production build
pnpm typecheck    # Type check
pnpm db:push      # Apply schema changes
pnpm db:studio    # DB explorer
pnpm email        # Email preview
```
