import {
	Link,
	Form,
	useNavigation,
	createSearchParams,
	useLocation,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from '../../+types'

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

import { useFormSuccess } from '../../lib/use-form-success'
import { type TransactionsTabProps } from './tab'

type Props = {
	lastResult?: SubmissionResult
	onSuccess?: () => void
} & Route.ComponentProps['loaderData']['formData'] &
	(
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				transaction: TransactionsTabProps['transactions'][number]
		  }
	)

export function TransactionForm({
	selectData,
	balances,
	lastResult,
	onSuccess,
	...props
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t, i18n } = useTranslation(['transactions', 'constants'])

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
					buttonLabel: t('form.create.submitButton'),
					formAction: '/app/transactions/create',
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
					buttonLabel: t('form.edit.submitButton'),
					formAction: `/app/transactions/${props.transaction.id}/edit`,
				}

	const isSubmitting =
		navigation.formAction === formAction &&
		navigation.state === 'submitting'

	useFormSuccess(formAction, onSuccess)

	const [form, fields] = useForm({
		lastResult,
		id: 'transaction-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(createTransactionFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createTransactionFormSchema(t),
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
			? t('form.availableBalance', {
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
			<Form
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
					label={t('form.transactionTypeLabel')}
					field={fields.type}
					placeholder={t('form.transactionTypePlaceholder')}
					items={transactionTypeOptions}
				/>

				{accounts.length !== 0 ? (
					<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
						<ComboboxField
							label={t('form.accountLabel')}
							field={fields.accountId}
							buttonPlaceholder={t('form.accountPlaceholder')}
							options={accountOptions}
						/>

						<ComboboxField
							label={t('form.currencyLabel')}
							field={fields.currencyId}
							buttonPlaceholder={t('form.currencyPlaceholder')}
							options={currencyOptions}
						/>
					</div>
				) : (
					<Text size='sm' theme='muted' alignment='center'>
						<Trans
							ns='transactions'
							i18nKey='form.noAccountMessage'
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
					label={t('form.amountLabel')}
					field={fields.amount}
					description={balanceDescription}
					maxValue={selectedBalance?.balance}
				/>

				<ComboboxField
					label={t('form.categoryLabel')}
					field={fields.category}
					buttonPlaceholder={t('form.categoryPlaceholder')}
					options={categoryOptions}
				/>

				<DateField
					label={t('form.dateLabel')}
					field={fields.date}
					disableFuture
				/>

				<TextField
					label={t('form.descriptionLabel')}
					field={fields.description}
				/>
			</Form>

			<div className='flex gap-2'>
				<Button
					width='full'
					variant='outline'
					{...form.reset.getButtonProps()}
				>
					{t('form.resetButton')}
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
