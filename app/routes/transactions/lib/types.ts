import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from './constants'

export type TTransactionType = (typeof TRANSACTION_TYPES)[number]

export type TCategory = (typeof TRANSACTION_CATEGORIES)[number]
