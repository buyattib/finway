import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import {
	ArrowRightLeftIcon,
	ReceiptTextIcon,
	RefreshCwIcon,
} from 'lucide-react'

import type { Route } from '../../+types'
import type { Route as EditRoute } from '../../+types/edit'

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

type EditLoaderData = EditRoute.ComponentProps['loaderData']
type TransactionEditData = Extract<
	EditLoaderData,
	{ transaction: unknown }
>['transaction']
type TransferEditData = Extract<
	EditLoaderData,
	{ transfer: unknown }
>['transfer']
type ExchangeEditData = Extract<
	EditLoaderData,
	{ exchange: unknown }
>['exchange']

type SharedProps = Route.ComponentProps['loaderData']['formData']

type Props = SharedProps &
	(
		| { action: typeof ACTION_CREATION; entity: TMovementTab }
		| {
				action: typeof ACTION_EDITION
				entity: typeof MOVEMENT_TAB_TRANSACTIONS
				transaction: TransactionEditData
		  }
		| {
				action: typeof ACTION_EDITION
				entity: typeof MOVEMENT_TAB_TRANSFERS
				transfer: TransferEditData
		  }
		| {
				action: typeof ACTION_EDITION
				entity: typeof MOVEMENT_TAB_EXCHANGES
				exchange: ExchangeEditData
		  }
	)

export function MovementFormDialog({ selectData, balances, ...props }: Props) {
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
			<DialogContent
				className='sm:max-w-xl max-h-[90vh] overflow-y-auto'
				onOpenAutoFocus={e => e.preventDefault()}
			>
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
							defaultValue={props.entity}
							onValueChange={value =>
								navigate(`/app/movements/${value}/create`, {
									replace: true,
								})
							}
							placeholder={t('dialog.entityPlaceholder')}
						/>
					</div>
				)}

				{props.entity === MOVEMENT_TAB_TRANSACTIONS && (
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

				{props.entity === MOVEMENT_TAB_TRANSFERS && (
					<TransferForm
						selectData={selectData}
						balances={balances}
						{...(props.action === ACTION_EDITION
							? {
									action: props.action,
									transfer: props.transfer,
								}
							: {
									action: props.action,
								})}
					/>
				)}

				{props.entity === MOVEMENT_TAB_EXCHANGES && (
					<ExchangeForm
						selectData={selectData}
						balances={balances}
						{...(props.action === ACTION_EDITION
							? {
									action: props.action,
									exchange: props.exchange,
								}
							: {
									action: props.action,
								})}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
