import { useRef } from 'react'
import { Form, useSubmit } from 'react-router'

import type { Route } from '../+types/credit-card'

import { TransactionType } from '~/components/transaction-type'
import { Combobox } from '~/components/ui/combobox'

import {
	CC_TRANSACTION_TYPES,
	CC_TRANSACTION_TYPE_LABEL,
} from '~/lib/constants'

export function CreditCardTransactionFilters({
	filters,
	selectData,
}: {
	filters: Route.ComponentProps['loaderData']['filters']
	selectData: Route.ComponentProps['loaderData']['selectData']
}) {
	const submit = useSubmit()
	const form = useRef<HTMLFormElement>(null)

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
				buttonPlaceholder='Filter by type'
				onValueChange={() => {
					if (!form.current) return
					submit(form.current)
				}}
			/>
			<Combobox
				options={transactionCategoryOptions}
				name='categoryId'
				defaultValue={filters.categoryId}
				buttonPlaceholder='Filter by category'
				onValueChange={() => {
					if (!form.current) return
					submit(form.current)
				}}
			/>
		</Form>
	)
}
