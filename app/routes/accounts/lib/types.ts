import { ACCOUNT_TYPES } from './constants'
import type { TCurrency } from '~/lib/types'

export type TAccountType = (typeof ACCOUNT_TYPES)[number]
export type TAccountBalance = {
	id: string
	balance: string
	currency: TCurrency
}
