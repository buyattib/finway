import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../schema'

console.log(process.env.DB_FILE_NAME)

const client = createClient({ url: process.env.DB_FILE_NAME! })
const db = drizzle(client, { schema, logger: true })

await db.insert(schema.users).values({ email: 'test2@test.com' })
const users_ = await db.select().from(schema.users)

console.log(users_)
