import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { removeCommas, initializeDate, formatNumber } from '~/lib/utils'
import { ACTION_CREATION } from '~/lib/constants'
import { getSelectData, getCurrencyById } from '~/lib/queries'

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

import { getTransactionCategoryById } from '~/routes/transaction-categories/lib/queries'

import {
	getCreditCardById,
	getStatementByDate,
	getStatementsFromDate,
	createCreditCardTransaction,
	ensureStatementsExist,
} from '../lib/queries'
import { createCreditCardTransactionFormSchema } from '../lib/schemas'
import {
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPES,
} from '../lib/constants'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({
	context,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response(t('transaction.create.loader.notFoundError'), {
			status: 404,
		})
	}

	const selectData = await getSelectData(db, user.id)

	return {
		creditCard: { brand: creditCard.brand, last4: creditCard.last4 },
		selectData,
		initialData: {
			creditCardId,
			type: CC_TRANSACTION_TYPE_CHARGE,
			amount: '0',
			totalInstallments: '1',
			description: '',
			currencyId: selectData.currencies?.[0]?.id || '',
			transactionCategoryId:
				selectData.transactionCategories?.[0]?.id || '',
		} as const,
		meta: {
			title: t('transaction.create.meta.title'),
			description: t('transaction.create.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: createCreditCardTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('transaction.create.action.invalidActionError'), {
			status: 422,
		})
	}

	const {
		action: _action,
		creditCardId,
		totalInstallments,
		...values
	} = submission.value

	const amount = Number(removeCommas(values.amount)) * 100

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						creditCardId: [
							t('transaction.create.action.creditCardNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const currency = await getCurrencyById({
		db,
		currencyId: values.currencyId,
	})
	if (!currency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						currencyId: [
							t('transaction.create.action.currencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const transactionCategory = await getTransactionCategoryById({
		db,
		transactionCategoryId: values.transactionCategoryId,
	})
	if (!transactionCategory || transactionCategory.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						transactionCategoryId: [
							t('transaction.create.action.categoryNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const transactionDate = new Date(values.date)
	const installmentCount = Number(totalInstallments)

	await ensureStatementsExist({ db, creditCardId, date: transactionDate })

	const transactionStatement = await getStatementByDate({
		db,
		creditCardId,
		date: transactionDate,
	})

	if (!transactionStatement) {
		throw new Error('Could not find statement for date')
	}

	const lastInstallmentDate = new Date(transactionStatement.closingDate)
	lastInstallmentDate.setMonth(
		lastInstallmentDate.getMonth() + installmentCount - 1,
	)
	await ensureStatementsExist({ db, creditCardId, date: lastInstallmentDate })

	const statements = await getStatementsFromDate({
		db,
		creditCardId,
		date: transactionStatement.closingDate,
		limit: installmentCount,
	})

	if (statements.length < installmentCount) {
		throw new Error(
			`Expected ${installmentCount} statements but found ${statements.length}`,
		)
	}

	const baseAmount = Math.floor(amount / installmentCount)
	const remainder = amount - baseAmount * installmentCount

	await createCreditCardTransaction({
		db,
		transactionData: {
			...values,
			amount,
			description: values.description ?? '',
		},
		creditCardId,
		installments: statements.map((statement, i) => ({
			installmentNumber: i + 1,
			amount: baseAmount + (i < remainder ? 1 : 0),
			statementId: statement.id,
		})),
	})

	return await redirectWithToast(
		`/app/credit-cards/${creditCardId}`,
		request,
		{
			type: 'success',
			title: t('transaction.create.action.successToast'),
		},
	)
}

export default function CreateCreditCardTransaction({
	loaderData: {
		creditCard,
		initialData,
		selectData: { transactionCategories, currencies },
	},
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['credit-cards', 'constants'])

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'cc-transaction-form',
		shouldValidate: 'onBlur',
		defaultValue: {
			date: initializeDate().toISOString(),
			...initialData,
		},
		constraint: getZodConstraint(createCreditCardTransactionFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createCreditCardTransactionFormSchema(t),
			})
		},
	})

	const installmentCount = Number(fields.totalInstallments.value) || 1
	const hasInstallments = installmentCount > 1

	const amountValue = Number(removeCommas(fields.amount.value ?? '0'))

	const transactionTypeOptions = CC_TRANSACTION_TYPES.map(i => ({
		icon: <TransactionType variant='icon' size='sm' transactionType={i} />,
		value: i,
		label: t(`constants:ccTransactionType.${i}`),
	}))

	const currencyOptions = currencies.map(({ id, code }) => ({
		icon: <CurrencyIcon currency={code} size='sm' />,
		value: id,
		label: code,
	}))

	const transactionCategoryOptions = transactionCategories.map(
		({ id, name }) => ({
			value: id,
			label: name,
		}),
	)

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to='../..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>{t('transaction.create.title')}</CardTitle>
				</div>
				<CardDescription>
					{t('transaction.create.description', {
						brand: creditCard.brand,
						last4: creditCard.last4,
					})}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form
					{...getFormProps(form)}
					method='post'
					className='flex flex-col gap-1'
				>
					{/* Have first button to be submit */}
					<button type='submit' className='hidden' />

					<input
						type='hidden'
						name='action'
						value={ACTION_CREATION}
					/>
					<input
						type='hidden'
						name='creditCardId'
						value={initialData.creditCardId}
					/>

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
							items={[
								{ value: '1', label: '1' },
								{ value: '3', label: '3' },
								{ value: '6', label: '6' },
								{ value: '9', label: '9' },
								{ value: '12', label: '12' },
								{ value: '18', label: '18' },
								{ value: '24', label: '24' },
							]}
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
						field={fields.transactionCategoryId}
						buttonPlaceholder={t(
							'transaction.create.categoryPlaceholder',
						)}
						options={transactionCategoryOptions}
					/>

					<DateField
						label={t('transaction.create.dateLabel')}
						field={fields.date}
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
					{t('transaction.create.submitButton')}
				</Button>
			</CardFooter>
		</Card>
	)
}
