import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { Form } from 'react-router'
import type { Route } from '../+types'

import { ComboboxField, SelectField } from '~/components/forms'
import { TransactionTypeIcon } from '~/components/transaction-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { Button } from '~/components/ui/button'

import { TRANSACTION_TYPE_DISPLAY, TRANSACTION_TYPES } from '../lib/constants'
import { TransactionFiltersSchema } from '../lib/schemas'

export function TransactionsFilters({
	filters,
	selectData,
}: {
	filters: Route.ComponentProps['loaderData']['filters']
	selectData: Route.ComponentProps['loaderData']['selectData']
}) {
	const [form, fields] = useForm({
		id: 'transactions-filters-form',
		shouldValidate: 'onSubmit',
		defaultValue: filters,
		constraint: getZodConstraint(TransactionFiltersSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: TransactionFiltersSchema,
			})
		},
	})

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: <TransactionTypeIcon size='sm' transactionType={i} />,
		value: i,
		label: TRANSACTION_TYPE_DISPLAY[i].label,
	}))

	const accountOptions = selectData.accounts.map(
		({ id, name, accountType }) => ({
			icon: <AccountTypeIcon accountType={accountType} size='xs' />,
			value: id,
			label: name,
		}),
	)

	const currencyOptions = selectData.currencies.map(({ id, code }) => ({
		icon: <CurrencyIcon currency={code} size='sm' />,
		value: id,
		label: code,
	}))

	const transactionCategoryOptions = selectData.transactionCategories.map(
		({ id, name }) => ({
			value: id,
			label: name,
		}),
	)

	return (
		<>
			<Form
				{...getFormProps(form)}
				method='get'
				className='grid md:grid-cols-2 grid-cols-1 gap-2 w-full'
			>
				<ComboboxField
					field={fields.accountId}
					items={accountOptions}
					buttonPlaceholder='Filter by accounts'
					hideErrors
				/>
				<ComboboxField
					field={fields.currencyId}
					items={currencyOptions}
					buttonPlaceholder='Filter by currencies'
					hideErrors
				/>
				<ComboboxField
					field={fields.transactionCategoryId}
					items={transactionCategoryOptions}
					buttonPlaceholder='Filter by categories'
					hideErrors
				/>
				<SelectField
					field={fields.transactionType}
					items={transactionTypeOptions}
					placeholder='Filter by type'
					hideErrors
				/>
			</Form>
			<div className='flex flex-col md:flex-row md:items-center md:justify-end gap-2'>
				<Button
					variant='outline'
					onClick={() => {
						Object.keys(filters).map(name => {
							form.update({ name, value: '' })
						})
					}}
				>
					Reset
				</Button>
				<Button form={form.id} type='submit'>
					Apply
				</Button>
			</div>
		</>
	)
}
