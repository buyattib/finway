import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { Route } from '../+types'

import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { Combobox } from '~/components/ui/combobox'

import {
	ALL_TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from '~/routes/transactions/lib/constants'

import { MOVEMENT_TAB_TRANSACTIONS } from '../lib/constants'

type TransactionsTabData = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_TRANSACTIONS }
>['transactions']

export function TransactionsFilters({
	filters,
	selectData,
}: {
	filters: TransactionsTabData['filters']
	selectData: TransactionsTabData['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)
	const { t } = useTranslation(['transactions', 'constants'])

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: (
			<TransactionType
				type='transaction'
				variant='icon'
				size='sm'
				transactionType={i}
			/>
		),
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

	const categoryOptions = ALL_TRANSACTION_CATEGORIES.map(c => ({
		value: c,
		label: t(`constants:categories.${c}.name`),
	}))

	const onValueChange = () => {
		if (!form.current) return
		submit(form.current)
	}

	return (
		<Form
			ref={form}
			id='transactions-filters'
			className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2'
		>
			<input type='hidden' name='tab' value={MOVEMENT_TAB_TRANSACTIONS} />
			<Combobox
				options={accountOptions}
				name='accountId'
				defaultValue={filters.accountId}
				buttonPlaceholder={t('filters.account')}
				onValueChange={onValueChange}
			/>
			<Combobox
				options={currencyOptions}
				name='currencyId'
				defaultValue={filters.currencyId}
				buttonPlaceholder={t('filters.currency')}
				onValueChange={onValueChange}
			/>
			<Combobox
				options={categoryOptions}
				name='category'
				defaultValue={filters.category}
				buttonPlaceholder={t('filters.category')}
				onValueChange={onValueChange}
			/>
			<Combobox
				options={transactionTypeOptions}
				name='transactionType'
				defaultValue={filters.transactionType}
				buttonPlaceholder={t('filters.type')}
				onValueChange={onValueChange}
			/>
		</Form>
	)
}
