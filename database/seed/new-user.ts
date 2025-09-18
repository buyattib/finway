import { getDb } from './db'
import * as schema from '../schema'

const db = getDb(schema)
await db.insert(schema.users).values({ email: 'admin@finhub.com' })
