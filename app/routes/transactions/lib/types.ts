import { TRANSACTION_TYPES } from './constants'

export type TTransactionType = (typeof TRANSACTION_TYPES)[number]
