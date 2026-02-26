import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { Route } from '../+types/credit-card'

import {
	CC_TRANSACTION_TYPES,
	CC_TRANSACTION_TYPE_LABEL,
} from '~/lib/constants'

import { TransactionType } from '~/components/transaction-type'
import { Combobox } from '~/components/ui/combobox'

export function CreditCardTransactionFilters({
	filters,
	selectData,
}: {
	filters: Route.ComponentProps['loaderData']['filters']
	selectData: Route.ComponentProps['loaderData']['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)
	const { t } = useTranslation('credit-cards')

	const transactionTypeOptions = CC_TRANSACTION_TYPES.map(i => ({
		icon: <TransactionType variant='icon' size='sm' transactionType={i} />,
		value: i,
		label: CC_TRANSACTION_TYPE_LABEL[i],
	}))

	const transactionCategoryOptions = selectData.transactionCategories.map(
		({ id, name }) => ({
			value: id,
			label: name,
		}),
	)

	return (
		<Form
			ref={form}
			className='flex flex-col sm:flex-row sm:items-center gap-2'
		>
			<Combobox
				options={transactionTypeOptions}
				name='type'
				defaultValue={filters.type}
				buttonPlaceholder={t('filters.type')}
				onValueChange={() => {
					if (!form.current) return
					submit(form.current)
				}}
			/>
			<Combobox
				options={transactionCategoryOptions}
				name='categoryId'
				defaultValue={filters.categoryId}
				buttonPlaceholder={t('filters.category')}
				onValueChange={() => {
					if (!form.current) return
					submit(form.current)
				}}
			/>
		</Form>
	)
}
