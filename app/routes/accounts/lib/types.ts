import { z } from 'zod'
import { ACCOUNT_TYPES, CURRENCIES } from './constants'
import { AccountFormSchema } from './schemas'

export type TAccountType = (typeof ACCOUNT_TYPES)[number]

export type TCurrency = (typeof CURRENCIES)[number]

export type TAccountFormSchema = z.infer<typeof AccountFormSchema>
