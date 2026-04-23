import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import {
	ArrowRightLeftIcon,
	ReceiptTextIcon,
	RefreshCwIcon,
} from 'lucide-react'

import type { Route } from '../../+types'

import type { Beautify } from '~/types/utils'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Select } from '~/components/select'

import {
	MOVEMENT_TAB_EXCHANGES,
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
} from '../../lib/constants'
import type { TMovementTab } from '../../lib/types'

import { TransactionForm } from './transaction'
import { TransferForm } from './transfer'
import { ExchangeForm } from './exchange'
import type { TransactionsTabProps } from '../transactions/tab'

type FormData = Route.ComponentProps['loaderData']['formData']

type Props = Beautify<
	FormData & {
		entity: TMovementTab
	} & (
			| {
					action: typeof ACTION_CREATION
			  }
			| {
					action: typeof ACTION_EDITION
					transaction: TransactionsTabProps['transactions'][number]
			  }
		)
>

export function MovementFormDialog({
	selectData,
	balances,
	entity,
	...props
}: Props) {
	const { t } = useTranslation('movements')
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const close = () =>
		navigate({
			pathname: '/app/movements',
			search: searchParams.toString(),
		})

	const entityOptions = [
		{
			value: MOVEMENT_TAB_TRANSACTIONS,
			label: t('dialog.entities.transaction'),
			icon: <ReceiptTextIcon className='size-4' />,
		},
		{
			value: MOVEMENT_TAB_TRANSFERS,
			label: t('dialog.entities.transfer'),
			icon: <ArrowRightLeftIcon className='size-4' />,
		},
		{
			value: MOVEMENT_TAB_EXCHANGES,
			label: t('dialog.entities.exchange'),
			icon: <RefreshCwIcon className='size-4' />,
		},
	]

	const isEditing = props.action === ACTION_EDITION

	return (
		<Dialog open onOpenChange={o => !o && close()}>
			<DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{t('dialog.title')}</DialogTitle>
					<DialogDescription>
						{t('dialog.description')}
					</DialogDescription>
				</DialogHeader>

				{!isEditing && (
					<div className='flex flex-col gap-1'>
						<Label>{t('dialog.entityLabel')}</Label>
						<Select
							options={entityOptions}
							defaultValue={entity}
							onValueChange={value =>
								navigate(`/app/movements/${value}/create`, {
									replace: true,
								})
							}
							placeholder={t('dialog.entityPlaceholder')}
						/>
					</div>
				)}

				{entity === MOVEMENT_TAB_TRANSACTIONS && (
					<TransactionForm
						selectData={selectData}
						balances={balances}
						{...(props.action === ACTION_EDITION
							? {
									action: props.action,
									transaction: props.transaction,
								}
							: {
									action: props.action,
								})}
					/>
				)}

				{entity === MOVEMENT_TAB_TRANSFERS && (
					<TransferForm
						action={ACTION_CREATION}
						selectData={selectData}
						balances={balances}
					/>
				)}

				{entity === MOVEMENT_TAB_EXCHANGES && (
					<ExchangeForm
						action={ACTION_CREATION}
						selectData={selectData}
						balances={balances}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
