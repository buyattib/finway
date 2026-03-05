import { z } from 'zod'
import type { TFunction } from 'i18next'

import {
	ACTION_CREATION,
	ACTION_EDITION,
	CC_TRANSACTION_TYPES,
} from '~/lib/constants'
import { removeCommas } from '~/lib/utils'

const ActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(ACTION_CREATION),
	}),
	z.object({
		action: z.literal(ACTION_EDITION),
		id: z.string(),
	}),
])

export function createCreditCardFormSchema(t: TFunction<'credit-cards'>) {
	return z
		.object({
			brand: z.string(t('form.schema.brandRequired')),
			last4: z
				.string(t('form.schema.last4Required'))
				.regex(/^\d{4}$/, t('form.schema.last4Invalid')),
			expiryMonth: z
				.string(t('form.schema.expiryMonthRequired'))
				.regex(/^\d{1,2}$/, t('form.schema.expiryMonthInvalid'))
				.refine(
					value => {
						const month = Number(value)
						return month >= 1 && month <= 12
					},
					{ message: t('form.schema.expiryMonthRange') },
				),
			expiryYear: z
				.string(t('form.schema.expiryYearRequired'))
				.regex(/^\d{4}$/, t('form.schema.expiryYearInvalid'))
				.refine(
					value => {
						const year = Number(value)
						return year >= new Date().getFullYear()
					},
					{ message: t('form.schema.expiryYearFuture') },
				),

			closingDate: z.iso.datetime(t('form.schema.closingDateRequired')),
			dueDate: z.iso.datetime(t('form.schema.dueDateRequired')),

			accountId: z.string(t('form.schema.accountRequired')),
			currencyId: z.string(t('form.schema.currencyRequired')),
		})
		.and(ActionSchema)
}

export type CreditCardFormSchema = ReturnType<typeof createCreditCardFormSchema>

export const DeleteCreditCardFormSchema = z.object({
	creditCardId: z.string(),
	intent: z.literal('delete-card'),
})

export function createCreditCardTransactionFormSchema(
	t: TFunction<'credit-cards'>,
) {
	return z
		.object({
			date: z.iso.datetime(t('transaction.create.schema.dateRequired')),
			type: z.enum(
				CC_TRANSACTION_TYPES,
				t('transaction.create.schema.transactionTypeRequired'),
			),
			amount: z
				.string({
					message: t('transaction.create.schema.amountRequired'),
				})
				.refine(
					value => {
						const formatted = removeCommas(value)
						return !isNaN(Number(formatted))
					},
					{
						message: t('transaction.create.schema.amountInvalid'),
					},
				)
				.refine(
					value => {
						const formatted = removeCommas(value)
						return Number(formatted) > 0
					},
					{
						message: t('transaction.create.schema.amountPositive'),
					},
				),
			totalInstallments: z
				.string()
				.refine(value => !isNaN(Number(value)) && Number(value) >= 1, {
					message: t('transaction.create.schema.installmentsMin'),
				}),
			firstInstallmentDate: z.iso.datetime(),
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),
			transactionCategoryId: z.string(
				t('transaction.create.schema.categoryRequired'),
			),
			creditCardId: z.string(
				t('transaction.create.schema.creditCardRequired'),
			),
		})
		.and(ActionSchema)
}

export type CreditCardTransactionFormSchema = ReturnType<
	typeof createCreditCardTransactionFormSchema
>

export const DeleteCreditCardTransactionFormSchema = z.object({
	creditCardTransactionId: z.string(),
	intent: z.literal('delete-transaction'),
})
