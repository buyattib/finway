import { MOVEMENT_TABS } from './constants'
import { type getMovementFormData } from './queries'

export type TMovementTab = (typeof MOVEMENT_TABS)[number]

export type TMovementFormData = ReturnType<Awaited<typeof getMovementFormData>>
