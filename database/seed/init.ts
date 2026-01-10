import * as schema from '../schema'
import { getDb } from './db'

import { CURRENCY_USDT, CURRENCY_USDC } from '~/routes/accounts/lib/constants'

const db = getDb(schema)
