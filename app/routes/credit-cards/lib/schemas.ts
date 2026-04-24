import { z } from 'zod'
import type { TFunction } from 'i18next'

import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'
import {
	ALL_TRANSACTION_CATEGORIES,
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from '~/features/transactions/constants'

import { CC_BRANDS } from './constants'

const ActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(ACTION_CREATION),
	}),
	z.object({
		action: z.literal(ACTION_EDITION),
		id: z.string(),
	}),
])

export function creditCardFormSchema(t: TFunction<'credit-cards'>) {
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
			institution: z.string(t('form.schema.institutionRequired')),
		})
		.and(ActionSchema)
}

export function editStatementFormSchema(t: TFunction<'credit-cards'>) {
	return z
		.object({
			statementId: z.string(),
			closingDate: z.iso.datetime(
				t('form.schema.currentClosingDateRequired'),
			),
			dueDate: z.iso.datetime(t('form.schema.currentDueDateRequired')),
		})
		.refine(
			data => {
				const closing = new Date(data.closingDate)
				const due = new Date(data.dueDate)

				const diff = due.getTime() - closing.getTime()
				const diffDays = diff / (1000 * 60 * 60 * 24)

				return diff > 0 && Math.abs(diffDays) <= 20
			},
			{
				message: t('form.schema.dueDateMaxDifference'),
				path: ['dueDate'],
			},
		)
}

export function creditCardTransactionFormSchema(t: TFunction<'credit-cards'>) {
	return z
		.object({
			date: z.iso
				.datetime(t('transaction.create.schema.dateRequired'))
				.refine(value => new Date(value) <= new Date(), {
					message: t('transaction.create.schema.dateFuture'),
				}),
			type: z.enum(
				TRANSACTION_TYPES,
				t('transaction.create.schema.transactionTypeRequired'),
			),
			amount: z
				.string({
					message: t('transaction.create.schema.amountRequired'),
				})
				.refine(value => !isNaN(Number(value)), {
					message: t('transaction.create.schema.amountInvalid'),
				})
				.refine(value => Number(value) > 0, {
					message: t('transaction.create.schema.amountPositive'),
				}),
			totalInstallments: z.string().refine(
				value => {
					const n = Number(value)
					return !isNaN(n) && n >= 1 && Number.isInteger(n)
				},
				{
					message: t('transaction.create.schema.installmentsMin'),
				},
			),
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),
			currencyId: z.string(
				t('transaction.create.schema.currencyRequired'),
			),
			category: z.enum(
				ALL_TRANSACTION_CATEGORIES,
				t('transaction.create.schema.categoryRequired'),
			),
		})
		.refine(
			data =>
				(
					TRANSACTION_CATEGORIES[data.type] as readonly string[]
				).includes(data.category),
			{
				message: t('transaction.create.schema.categoryInvalidForType'),
				path: ['category'],
			},
		)
		.and(ActionSchema)
}
