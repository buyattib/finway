import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { Route } from '../+types'

import { TRANSACTION_TYPES } from '~/lib/constants'

import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { Combobox } from '~/components/ui/combobox'

export function TransactionsFilters({
	filters,
	selectData,
}: {
	filters: Route.ComponentProps['loaderData']['filters']
	selectData: Route.ComponentProps['loaderData']['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)
	const { t } = useTranslation(['transactions', 'constants'])

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: <TransactionType variant='icon' size='sm' transactionType={i} />,
		value: i,
		label: t(`constants:transactionType.${i}`),
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
				className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2'
			>
				<Combobox
					options={accountOptions}
					name='accountId'
					defaultValue={filters.accountId}
					buttonPlaceholder={t('filters.account')}
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Combobox
					options={currencyOptions}
					name='currencyId'
					defaultValue={filters.currencyId}
					buttonPlaceholder={t('filters.currency')}
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Combobox
					options={transactionCategoryOptions}
					name='transactionCategoryId'
					defaultValue={filters.transactionCategoryId}
					buttonPlaceholder={t('filters.category')}
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
				<Combobox
					options={transactionTypeOptions}
					name='transactionType'
					defaultValue={filters.transactionType}
					buttonPlaceholder={t('filters.type')}
					onValueChange={() => {
						if (!form.current) return
						submit(form.current)
					}}
				/>
			</Form>
		</>
	)
}
