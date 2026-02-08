## Install dependencies
- `pnpm install`

## Build the app
- `pnpm run build`

## Run the app

### In local development server

- Development server with develop variables: `pnpm dev`
- Development server with production variables: `pnpm prod`

### In local build server

- Build server with develop variables: `pnpm run start.development`
- Build server with production variables: `pnpm run start.production`

## Database view

- Browse the db with drizzle studio: `pnpm run db:studio` (spins a server in localhost:6001)

## Database migrations

There are scripts in the package.json defined to:

- `pnpm run db:push`: applies changes to the db
- `pnpm run db:generate` migration_name: generates a .sql migration file
- `pnpm run db:generate-custom <migration_name>`: generates a custom .sql migration file (to write your own sql)
- `pnpm run db:migrate`: applies the migrations in the generated .sql file
- `pnpm run db:drop`: prompts you to select a migration to remove (does not apply changes on the db)

NOTE: when modifying generated migrations, dont remove the: --> statement-breakpoint
as its used to run multiple statements


## Run scripts

- Development: `pnpm run script.development -- path/to/script.ts`
- Production: `pnpm run script.production -- path/to/script.ts`

## Emails

- Resend + react-email is used
- Emails are found in app/emails/ dir
- To preview emails run: `pnpm run email` (spins server to preview emails in localhost:6000)

## Other

- Type check: `pnpm run typecheck`
- Formatting: `pnpm run format`
