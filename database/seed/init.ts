import { sql } from 'drizzle-orm'

import * as schema from '../schema'
import { getDb } from './db'

const db = getDb(schema)

// await db.insert(schema.user).values({ email: 'test@email.com' })
// await db.insert(schema.user).values({ email: 'test@email.com' })
