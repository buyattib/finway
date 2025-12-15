import { z } from 'zod'
import { TransactionCategoryFormSchema } from './schemas'

export type TTransactionCategoryFormSchema = z.infer<
	typeof TransactionCategoryFormSchema
>
