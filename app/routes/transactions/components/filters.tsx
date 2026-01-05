import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'
import type { Route } from '../+types'

import { TransactionTypeIcon } from '~/components/transaction-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { Combobox } from '~/components/ui/combobox'
import { Select } from '~/components/select'

import { TRANSACTION_TYPE_DISPLAY, TRANSACTION_TYPES } from '../lib/constants'

export function TransactionsFilters({
	filters,
	selectData,
}: {
	filters: Route.ComponentProps['loaderData']['filters']
	selectData: Route.ComponentProps['loaderData']['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)

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
				ref={form}
				id='transactions-filters'
				className='flex sm:flex-row sm:items-center gap-2'
			>
				<Combobox
					options={accountOptions}
					name='accountId'
					defaultValue={filters.accountId}
					buttonPlaceholder='Filter by account'
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Combobox
					options={currencyOptions}
					name='currencyId'
					defaultValue={filters.currencyId}
					buttonPlaceholder='Filter by currency'
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Combobox
					options={transactionCategoryOptions}
					name='transactionCategoryId'
					defaultValue={filters.transactionCategoryId}
					buttonPlaceholder='Filter by category'
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Select
					clearable
					options={transactionTypeOptions}
					name='transactionType'
					defaultValue={filters.transactionType}
					placeholder='Filter by type'
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
			</Form>
		</>
	)
}
