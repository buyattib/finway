import { sql } from 'drizzle-orm'

import * as schema from '../schema'
import { getDb } from './db'

const db = getDb(schema)
