import {
	Link,
	useFetcher,
	createSearchParams,
	useLocation,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from '../../+types'
import type { Route as EditRoute } from '../../+types/edit'

import { initializeDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import {
	ErrorList,
	AmountField,
	DateField,
	ComboboxField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { createTransferFormSchema } from '~/routes/transfers/lib/schemas'

type TransferEditData = Extract<
	EditRoute.ComponentProps['loaderData'],
	{ transfer: unknown }
>['transfer']

type Props = Route.ComponentProps['loaderData']['formData'] &
	(
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				transfer: TransferEditData
		  }
	)

export function TransferForm({
	selectData,
	balances,
	...props
}: Props) {
	const fetcher = useFetcher<{ submission?: SubmissionResult }>()
	const { t, i18n } = useTranslation('movements')
	const { t: tSchema } = useTranslation('transfers')
	const location = useLocation()

	const { accounts, currencies } = selectData

	const { defaultValue, buttonLabel, formAction } =
		props.action === ACTION_CREATION
			? {
					defaultValue: {
						date: initializeDate().toISOString(),
						amount: '0',
						currencyId: '',
						fromAccountId: '',
						toAccountId: '',
					},
					buttonLabel: t('form.common.createSubmitButton'),
					formAction: '/app/movements/transfers/create',
				}
			: {
					defaultValue: {
						date: props.transfer.date,
						amount: props.transfer.amount,
						currencyId: props.transfer.currencyId,
						fromAccountId: props.transfer.fromAccountId,
						toAccountId: props.transfer.toAccountId,
					},
					buttonLabel: t('form.common.editSubmitButton'),
					formAction: `/app/movements/transfers/${props.transfer.id}/edit`,
				}

	const isSubmitting = fetcher.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: fetcher.data?.submission,
		id: 'transfer-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(createTransferFormSchema(tSchema)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createTransferFormSchema(tSchema),
			})
		},
	})

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='sm' />,
		value: id,
		label: name,
	}))

	const currencyOptions = currencies.map(c => ({
		icon: <CurrencyIcon currency={c.code} size='sm' />,
		value: c.id,
		label: c.code,
	}))

	const selectedBalance = balances.find(
		b =>
			b.accountId === fields.fromAccountId.value &&
			b.currencyId === fields.currencyId.value,
	)

	const balanceDescription = selectedBalance
		? t('form.common.availableBalance', {
				symbol: getCurrencySymbol(selectedBalance.currency),
				amount: formatNumber(selectedBalance.balance, i18n.language),
				currency: selectedBalance.currency,
			})
		: undefined

	return (
		<>
			<fetcher.Form
				{...getFormProps(form)}
				method='post'
				action={formAction}
				className='flex flex-col gap-1'
			>
				{/* Have first button to be submit */}
				<button type='submit' className='hidden' />

				<input type='hidden' name='action' value={props.action} />

				{props.action === ACTION_EDITION && (
					<input type='hidden' name='id' value={props.transfer.id} />
				)}

				<ErrorList size='md' errors={form.errors} id={form.errorId} />

				<DateField label={t('form.transfer.dateLabel')} field={fields.date} />

				{accounts.length !== 0 ? (
					<>
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label={t('form.transfer.fromAccountLabel')}
								field={fields.fromAccountId}
								buttonPlaceholder={t('form.transfer.accountPlaceholder')}
								options={accountOptions}
							/>

							<ComboboxField
								label={t('form.transfer.toAccountLabel')}
								field={fields.toAccountId}
								buttonPlaceholder={t('form.transfer.accountPlaceholder')}
								options={accountOptions}
							/>
						</div>

						<ComboboxField
							label={t('form.transfer.currencyLabel')}
							field={fields.currencyId}
							buttonPlaceholder={t('form.transfer.currencyPlaceholder')}
							options={currencyOptions}
						/>

						<AmountField
							label={t('form.transfer.amountLabel')}
							field={fields.amount}
							description={balanceDescription}
							maxValue={selectedBalance?.balance}
						/>
					</>
				) : (
					<Text size='sm' theme='muted' alignment='center'>
						<Trans
							i18nKey='form.common.noAccountMessage'
							ns='movements'
							components={[
								<Link
									key='0'
									to={{
										pathname: '/app/accounts/create',
										search: createSearchParams({
											redirectTo: location.pathname,
										}).toString(),
									}}
									className='text-primary'
								/>,
							]}
						/>
					</Text>
				)}
			</fetcher.Form>

			<div className='flex gap-2'>
				<Button
					width='full'
					variant='outline'
					{...form.reset.getButtonProps()}
				>
					{t('form.common.resetButton')}
				</Button>
				<Button
					width='full'
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{buttonLabel}
				</Button>
			</div>
		</>
	)
}
