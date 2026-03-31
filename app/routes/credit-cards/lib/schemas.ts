import { z } from 'zod'
import type { TFunction } from 'i18next'

import {
	ACTION_CREATION,
	ACTION_EDITION,
	CC_TRANSACTION_TYPES,
	CC_BRANDS,
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
			brand: z.enum(CC_BRANDS, t('form.schema.brandRequired')),
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

			currentClosingDate: z
				.iso
				.datetime(t('form.schema.currentClosingDateRequired'))
				.optional(),
			currentDueDate: z
				.iso
				.datetime(t('form.schema.currentDueDateRequired'))
				.optional(),
			accountId: z.string(t('form.schema.accountRequired')),
		})
		.and(ActionSchema)
		.refine(
			data => {
				if (data.action !== ACTION_CREATION) return true
				return !!data.currentClosingDate
			},
			{
				message: t('form.schema.currentClosingDateRequired'),
				path: ['currentClosingDate'],
			},
		)
		.refine(
			data => {
				if (data.action !== ACTION_CREATION) return true
				return !!data.currentDueDate
			},
			{
				message: t('form.schema.currentDueDateRequired'),
				path: ['currentDueDate'],
			},
		)
		.refine(
			data => {
				if (data.action !== ACTION_CREATION) return true
				if (!data.currentClosingDate || !data.currentDueDate) return true
				return new Date(data.currentDueDate) > new Date(data.currentClosingDate)
			},
			{
				message: t('form.schema.dueDateAfterClosingDate'),
				path: ['currentDueDate'],
			},
		)
		.refine(
			data => {
				if (data.action !== ACTION_CREATION) return true
				if (!data.currentClosingDate || !data.currentDueDate) return true
				const closing = new Date(data.currentClosingDate)
				const due = new Date(data.currentDueDate)
				const diffDays = (due.getTime() - closing.getTime()) / (1000 * 60 * 60 * 24)
				return diffDays <= 20
			},
			{
				message: t('form.schema.dueDateMaxDifference'),
				path: ['currentDueDate'],
			},
		)
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
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),
			currencyId: z.string(
				t('transaction.create.schema.currencyRequired'),
			),
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
