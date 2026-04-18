import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { Route } from '../+types'

import { CurrencyIcon } from '~/components/currency-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { Combobox } from '~/components/ui/combobox'

import { MOVEMENT_TAB_EXCHANGES } from '../lib/constants'

type ExchangesTabData = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_EXCHANGES }
>['exchanges']

export function ExchangesFilters({
	filters,
	selectData,
}: {
	filters: ExchangesTabData['filters']
	selectData: ExchangesTabData['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)
	const { t } = useTranslation('exchanges')

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

	const onValueChange = () => {
		if (!form.current) return
		submit(form.current)
	}

	return (
		<Form
			ref={form}
			id='exchanges-filters'
			className='grid grid-cols-1 sm:grid-cols-2 gap-2'
		>
			<input type='hidden' name='tab' value={MOVEMENT_TAB_EXCHANGES} />
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
		</Form>
	)
}
