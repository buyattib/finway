import { createContext } from 'react-router'
import type { DB, UserAuth } from '~/lib/types'

export const userContext = createContext<UserAuth>()

export const globalContext = createContext<{
	cspNonce: string
}>()

export const dbContext = createContext<DB>()
