import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

if (!process.env.DB_FILE_NAME) throw new Error('DB_FILE_NAME is required')

const client = createClient({ url: process.env.DB_FILE_NAME })
const db = drizzle(client)

console.log('Running migrations...')
await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations complete.')

client.close()
