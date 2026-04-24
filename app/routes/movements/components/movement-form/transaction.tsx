import { Link, useFetcher, createSearchParams, useLocation } from 'react-router'
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
	TextField,
	SelectField,
	ComboboxField,
	AmountField,
	DateField,
} from '~/components/forms'
import { TransactionType } from '~/components/transaction-type'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { createTransactionFormSchema } from '~/routes/transactions/lib/schemas'
import {
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_CATEGORIES,
} from '~/routes/transactions/lib/constants'
import type { TTransactionType } from '~/routes/transactions/lib/types'

type TransactionEditData = Extract<
	EditRoute.ComponentProps['loaderData'],
	{ transaction: unknown }
>['transaction']

type Props = Route.ComponentProps['loaderData']['formData'] &
	(
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				transaction: TransactionEditData
		  }
	)

export function TransactionForm({ selectData, balances, ...props }: Props) {
	const location = useLocation()
	const fetcher = useFetcher<{ submission?: SubmissionResult }>()
	const { t, i18n } = useTranslation(['movements', 'constants'])
	const { t: tSchema } = useTranslation('transactions')

	const { accounts, currencies } = selectData

	const { defaultValue, buttonLabel, formAction } =
		props.action === ACTION_CREATION
			? {
					defaultValue: {
						date: initializeDate().toISOString(),
						type: TRANSACTION_TYPE_EXPENSE,
						amount: '',
						description: '',
						accountId: accounts[0]?.id ?? '',
						currencyId: currencies[0]?.id ?? '',
						category:
							TRANSACTION_CATEGORIES[TRANSACTION_TYPE_EXPENSE][0],
					},
					buttonLabel: t('form.common.createSubmitButton'),
					formAction: '/app/movements/transactions/create',
				}
			: {
					defaultValue: {
						date: props.transaction.date,
						type: props.transaction.type,
						amount: props.transaction.amount,
						description: props.transaction.description ?? '',
						accountId: props.transaction.accountId,
						currencyId: props.transaction.currencyId,
						category: props.transaction.category,
					},
					buttonLabel: t('form.common.editSubmitButton'),
					formAction: `/app/movements/transactions/${props.transaction.id}/edit`,
				}

	const isSubmitting = fetcher.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: fetcher.data?.submission,
		id: 'transaction-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(createTransactionFormSchema(tSchema)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createTransactionFormSchema(tSchema),
			})
		},
	})

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

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='xs' />,
		value: id,
		label: name,
	}))

	const currencyOptions = currencies.map(({ id, code }) => ({
		icon: <CurrencyIcon currency={code} size='sm' />,
		value: id,
		label: code,
	}))

	const transactionType = fields.type.value as TTransactionType
	const categoryOptions = transactionType
		? TRANSACTION_CATEGORIES[transactionType].map(c => ({
				value: c,
				label: t(`constants:categories.${c}.name`),
				description: t(`constants:categories.${c}.description`),
			}))
		: []

	const selectedBalance = balances.find(
		b =>
			b.accountId === fields.accountId.value &&
			b.currencyId === fields.currencyId.value,
	)

	const balanceDescription =
		fields.type.value === TRANSACTION_TYPE_EXPENSE && selectedBalance
			? t('form.common.availableBalance', {
					symbol: getCurrencySymbol(selectedBalance.currency),
					amount: formatNumber(
						selectedBalance.balance,
						i18n.language,
					),
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
					<input
						type='hidden'
						name='id'
						value={props.transaction.id}
					/>
				)}

				<ErrorList size='md' errors={form.errors} id={form.errorId} />

				<SelectField
					label={t('form.transaction.transactionTypeLabel')}
					field={fields.type}
					placeholder={t('form.transaction.transactionTypePlaceholder')}
					items={transactionTypeOptions}
				/>

				{accounts.length !== 0 ? (
					<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
						<ComboboxField
							label={t('form.transaction.accountLabel')}
							field={fields.accountId}
							buttonPlaceholder={t('form.transaction.accountPlaceholder')}
							options={accountOptions}
						/>

						<ComboboxField
							label={t('form.transaction.currencyLabel')}
							field={fields.currencyId}
							buttonPlaceholder={t('form.transaction.currencyPlaceholder')}
							options={currencyOptions}
						/>
					</div>
				) : (
					<Text size='sm' theme='muted' alignment='center'>
						<Trans
							ns='movements'
							i18nKey='form.common.noAccountMessage'
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

				<AmountField
					label={t('form.transaction.amountLabel')}
					field={fields.amount}
					description={balanceDescription}
					maxValue={selectedBalance?.balance}
				/>

				<ComboboxField
					label={t('form.transaction.categoryLabel')}
					field={fields.category}
					buttonPlaceholder={t('form.transaction.categoryPlaceholder')}
					options={categoryOptions}
				/>

				<DateField
					label={t('form.transaction.dateLabel')}
					field={fields.date}
					disableFuture
				/>

				<TextField
					label={t('form.transaction.descriptionLabel')}
					field={fields.description}
				/>
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
