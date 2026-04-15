import { ASSETS_ACCOUNT_TYPES, LIABILITIES_ACCOUNT_TYPES } from './constants'
import type { TCurrency } from '~/lib/types'

export type TLiabilityAccountType = (typeof LIABILITIES_ACCOUNT_TYPES)[number]
export type TAssetAccountType = (typeof ASSETS_ACCOUNT_TYPES)[number]

export type TAccountType = TLiabilityAccountType | TAssetAccountType

type TAccountBalance = {
	id: string
	balance: string
	currency: TCurrency
}

export type TBalanceByAccount = Record<string, TAccountBalance[]>
