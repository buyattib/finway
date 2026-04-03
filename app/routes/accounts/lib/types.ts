import { ACCOUNT_TYPES } from './constants'
import type { TCurrency } from '~/lib/types'

export type TAccountType = (typeof ACCOUNT_TYPES)[number]

type TAccountBalance = {
	id: string
	balance: string
	currency: TCurrency
}

export type TBalanceByAccount = Record<string, TAccountBalance[]>
