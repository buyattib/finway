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

## Imports order

Imports are grouped by distance from the current file, separated by blank lines, with third-party (farthest) first and relative (closest) last:

1. **Third-party libraries** — `react-router`, `lucide-react`, `zod`, `drizzle-orm`, `@conform-to/*`, etc.
2. **Route types** — `./+types/*` or `../+types/*`
3. **App core** — `~/database/*`, `~/utils-server/*`
4. **App lib** — `~/lib/*`
5. **Shared components** — `~/components/*`
6. **Local/relative imports** — `./lib/*`, `../lib/*`, `./components/*`

## Internationalization (i18n)

**Stack:** `i18next` + `react-i18next` + `remix-i18next/middleware` — configured in `app/middleware/i18next.ts`
**Languages:** `en` (source of truth for types), `es` — `es` files use `satisfies typeof en`

### Locale File Structure

```
app/locales/
  index.ts              ← exports { en, es } as Resource
  en/index.ts           ← assembles all namespaces (accounts, components, etc.)
  en/components.ts      ← shared cross-route translations (accountType, transactionType)
  es/index.ts
  es/components.ts

app/routes/<route>/lib/locales/
  en.ts                 ← route-specific translations
  es.ts                 ← satisfies typeof en
```

New route locales must be registered in `app/locales/en/index.ts` and `app/locales/es/index.ts`.

### Locale Key Shape

Keys are grouped by sub-route (`index`, `form`, `details`), each containing `meta`, UI labels, `schema` (Zod messages), `action` (toast/error strings):

```ts
export default {
  index: {
    meta: { title: '...', description: '...' },
    title: '...',
    emptyMessage: '...Start creating them <0>here</0>.',   // <Trans> placeholder
    emptySearchMessage: 'No results for {{search}}',       // interpolation
  },
  form: {
    nameLabel: 'Name',
    schema: { nameRequired: 'Name is required' },
    create: { meta: { ... }, action: { successToast: '...', duplicateError: '...' }, title: '...', submitButton: '...' },
    edit: { /* same shape, with notFoundTitle variant */ },
  },
  details: {
    meta: { title: 'Account {{name}} | Finway', notFoundTitle: '...' },
    action: { successToast: '...', deleteErrorToast: '...' },
    deleteAriaLabel: 'Delete account {{name}}',
  },
}
```

### Server-Side

Use `getServerT` from `~/utils-server/i18n.server.ts` in loaders/actions for meta tags, toasts, errors, and schema factories:

```ts
const t = getServerT(context, 'accounts')
t('index.meta.title')
t('details.action.successToast', { name: account.name })
```

Meta is translated in the loader and passed through `loaderData` — the `meta()` export just reads from it.

### Client-Side

```ts
const { t } = useTranslation(['accounts', 'constants'])
t('index.title')                              // primary namespace
t(`constants:accountType.${accountType}`)     // cross-namespace with prefix
```

### Zod Schema Factory

Schemas are **factory functions** that accept `TFunction` so validation messages are translated on both server and client:

```ts
export function createAccountFormSchema(t: TFunction<'accounts'>) {
  return z.object({
    name: z.string(t('form.schema.nameRequired')).transform(v => v.trim()),
    accountType: z.enum(ACCOUNT_TYPES, t('form.schema.accountTypeRequired')),
  }).and(ActionSchema)
}
```

### Rich Text (`<Trans>`)

For translations containing JSX (links, bold, etc.), use `<Trans>` with `<0>` positional placeholders:

```tsx
<Trans ns='accounts' i18nKey='index.emptyMessage'>
  ...Start creating them <Link to='create'>here</Link>
</Trans>
```

### Steps to i18n a New Route

1. Create `app/routes/<route>/lib/locales/en.ts` and `es.ts` (with `satisfies typeof en`)
2. Register in `app/locales/en/index.ts` and `app/locales/es/index.ts`
3. Convert Zod schemas to factory functions: `createXFormSchema(t: TFunction<'namespace'>)`
4. In loaders/actions: `getServerT(context, 'namespace')` for meta, toasts, errors, schema
5. In components: `useTranslation(['namespace', 'components'])` for UI strings
6. Use `{{variable}}` for interpolation, `<Trans>` for rich text with JSX

## Commands

```sh
pnpm dev          # Dev server
pnpm build        # Production build
pnpm typecheck    # Type check
pnpm db:studio    # DB explorer
pnpm email        # Email preview
```
