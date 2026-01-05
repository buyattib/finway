import { ACCOUNT_TYPES, CURRENCIES } from './constants'

export type TAccountType = (typeof ACCOUNT_TYPES)[number]
export type TCurrency = (typeof CURRENCIES)[number]

export type TAccountBalance = {
	id: string
	balance: string
	currency: TCurrency
}
