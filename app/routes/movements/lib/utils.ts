import { MOVEMENT_TABS } from './constants'
import type { TMovementTab } from './types'

export function assertMovementTab(
	movement: string | undefined,
): asserts movement is TMovementTab {
	if (!MOVEMENT_TABS.includes(movement as TMovementTab)) {
		throw new Response('Not Found', { status: 404 })
	}
}

export function assertNever(value: never): never {
	throw new Error(`Unexpected value: ${String(value)}`)
}
