import { Link, Form, useNavigation, useLocation } from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route as CreateRoute } from '../+types/create'
import type { Route as EditRoute } from '../+types/edit'

import { initializeDate, formatNumber } from '~/lib/utils'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	ErrorList,
	TextField,
	SelectField,
	ComboboxField,
	AmountField,
	DateField,
} from '~/components/forms'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'

import {
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from '~/routes/transactions/lib/constants'

import { creditCardTransactionFormSchema } from '../../lib/schemas'
import { CC_INSTALLMENT_OPTIONS } from '../../lib/constants'

type TCreateLoaderData = CreateRoute.ComponentProps['loaderData']

export type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']
type Props = {
	creditCard: TCreateLoaderData['creditCard']
	selectData: TCreateLoaderData['selectData']
	lastResult?: SubmissionResult
	initialData: Partial<TInitialData>
	action: typeof ACTION_CREATION | typeof ACTION_EDITION
}

export function CreditCardTransactionForm({
	creditCard,
	selectData: { currencies },
	lastResult,
	initialData,
	action,
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t, i18n } = useTranslation(['credit-cards', 'constants'])

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { defaultValue, title, description, buttonLabel, to } = {
		[ACTION_CREATION]: {
			defaultValue: {
				date: initializeDate().toISOString(),
				...initialData,
			},
			title: t('transaction.create.title'),
			description: t('transaction.create.description', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
			buttonLabel: t('transaction.create.submitButton'),
			to: '../..',
		},
		[ACTION_EDITION]: {
			defaultValue: initialData,
			title: t('transaction.edit.title'),
			description: t('transaction.edit.description', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
			buttonLabel: t('transaction.edit.submitButton'),
			to: '..',
		},
	}[action]

	const [form, fields] = useForm({
		lastResult,
		id: 'cc-transaction-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(creditCardTransactionFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: creditCardTransactionFormSchema(t),
			})
		},
	})

	const installmentCount = Number(fields.totalInstallments.value) || 1
	const hasInstallments = installmentCount > 1

	const amountValue = Number(fields.amount.value ?? '0')

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: (
			<TransactionType
				type='credit_card'
				variant='icon'
				size='sm'
				transactionType={i}
			/>
		),
		value: i,
		label: t(`constants:ccTransactionType.${i}`),
	}))

	const currencyOptions = currencies.map(({ id, code }) => ({
		icon: <CurrencyIcon currency={code} size='sm' />,
		value: id,
		label: code,
	}))

	const categoryOptions = TRANSACTION_CATEGORIES.map(c => ({
		value: c,
		label: t(`constants:categories.${c}.name`),
	}))

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to={to} relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>{title}</CardTitle>
				</div>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form
					{...getFormProps(form)}
					method='post'
					className='flex flex-col gap-1'
				>
					{/* Have first button to be submit */}
					<button type='submit' className='hidden' />

					<input type='hidden' name='action' value={action} />

					{action === ACTION_EDITION && initialData.id && (
						<input type='hidden' name='id' value={initialData.id} />
					)}

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>

					<SelectField
						label={t('transaction.create.transactionTypeLabel')}
						field={fields.type}
						placeholder={t(
							'transaction.create.transactionTypePlaceholder',
						)}
						items={transactionTypeOptions}
					/>

					<div className='grid grid-cols-1 md:grid-cols-5 gap-2'>
						<AmountField
							className='md:col-span-4'
							label={t('transaction.create.amountLabel')}
							field={fields.amount}
							{...(hasInstallments &&
								amountValue > 0 && {
									description: t(
										'transaction.create.perInstallment',
										{
											amount: formatNumber(
												amountValue / installmentCount,
												i18n.language,
												{
													maximumFractionDigits: 2,
												},
											),
										},
									),
								})}
						/>

						<SelectField
							className='md:col-span-1'
							label={t('transaction.create.installmentsLabel')}
							field={fields.totalInstallments}
							placeholder={t(
								'transaction.create.installmentsPlaceholder',
							)}
							items={CC_INSTALLMENT_OPTIONS.map(v => ({
								value: v,
								label: v,
							}))}
						/>
					</div>

					<ComboboxField
						label={t('transaction.create.currencyLabel')}
						field={fields.currencyId}
						buttonPlaceholder={t(
							'transaction.create.currencyPlaceholder',
						)}
						options={currencyOptions}
					/>

					<ComboboxField
						label={t('transaction.create.categoryLabel')}
						field={fields.category}
						buttonPlaceholder={t(
							'transaction.create.categoryPlaceholder',
						)}
						options={categoryOptions}
					/>

					<DateField
						label={t('transaction.create.dateLabel')}
						field={fields.date}
						disableFuture
					/>

					<TextField
						label={t('transaction.create.descriptionLabel')}
						field={fields.description}
					/>
				</Form>
			</CardContent>
			<CardFooter className='gap-2'>
				<Button
					width='full'
					variant='outline'
					{...form.reset.getButtonProps()}
				>
					{t('transaction.create.resetButton')}
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
			</CardFooter>
		</Card>
	)
}
