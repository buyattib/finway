export const MOVEMENT_TAB_TRANSACTIONS = 'transactions'
export const MOVEMENT_TAB_TRANSFERS = 'transfers'
export const MOVEMENT_TAB_EXCHANGES = 'exchanges'

export const MOVEMENT_TABS = [
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
] as const

export type TMovementTab = (typeof MOVEMENT_TABS)[number]

export const DEFAULT_MOVEMENT_TAB: TMovementTab = MOVEMENT_TAB_TRANSACTIONS
