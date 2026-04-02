import { CC_TRANSACTION_TYPES } from './constants'

export type TCCTransactionType = (typeof CC_TRANSACTION_TYPES)[number]
