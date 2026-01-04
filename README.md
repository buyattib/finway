## Install dependencies

- pnpm install

## Run the local dev server

- pnpm dev

## Database view

- Browse the db with drizzle studio: pnpm run db:studio (spins a server in localhost:6001)

## Database migrations

There are scripts in the package.json defined to:

- pnpm run db:push: applies changes to the db
- pnpm run db:generate migration_name: generates a .sql migration file
- pnpm run db:generate-custom migration_name: generates a custom .sql migration file (to write your own sql)
- pnpm run db:migrate: applies the migrations in the generated .sql file
- pnpm run db:drop: prompts you to select a migration to remove (does not apply changes on the db)

## Run scripts

- With 'script' script: pnpm run script -- database/seed/new-user.ts

## Emails

- Resend + react-email is used
- Emails are found in app/emails/ dir
- To preview emails run: pnpm run email (spins server to preview emails in localhost:6000)
