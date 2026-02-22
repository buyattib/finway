import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import {
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
} from '~/database/schema'
import { removeCommas, initializeDate, formatNumber } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import {
	ACTION_CREATION,
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPES,
	CC_TRANSACTION_TYPE_LABEL,
} from '~/lib/constants'
import { getSelectData } from '~/lib/queries'

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

import { CreditCardTransactionFormSchema } from '../lib/schemas'

export function meta() {
	return [
		{ title: 'Create a credit card transaction | Finway' },
		{
			property: 'og:title',
			content: 'Create a credit card transaction | Finway',
		},
		{
			name: 'description',
			content: 'Create a credit card transaction',
		},
	]
}

export async function loader({
	context,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const creditCard = await db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: { id: true, brand: true, last4: true },
		with: { account: { columns: { ownerId: true } } },
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response('Credit card not found', { status: 404 })
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
			transactionCategoryId:
				selectData.transactionCategories?.[0]?.id || '',
		} as const,
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreditCardTransactionFormSchema.transform(data => ({
			...data,
			amount: Number(removeCommas(data.amount)) * 100,
		})).superRefine(async (data, ctx) => {
			const creditCard = await db.query.creditCard.findFirst({
				where: (creditCard, { eq }) =>
					eq(creditCard.id, data.creditCardId),
				columns: { id: true },
				with: { account: { columns: { ownerId: true } } },
			})
			if (!creditCard || creditCard.account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Credit card not found',
					path: ['creditCardId'],
				})
			}

			const transactionCategory =
				await db.query.transactionCategory.findFirst({
					where: (transactionCategory, { eq }) =>
						eq(transactionCategory.id, data.transactionCategoryId),
					columns: { ownerId: true },
				})
			if (
				!transactionCategory ||
				transactionCategory.ownerId !== user.id
			) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Transaction category not found',
					path: ['transactionCategoryId'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const {
		action,
		creditCardId,
		totalInstallments,
		firstInstallmentDate,
		...transactionData
	} = submission.value

	await db.transaction(async tx => {
		const [{ id: creditCardTransactionId }] = await tx
			.insert(creditCardTransactionTable)
			.values({
				...transactionData,
				creditCardId,
			})
			.returning({ id: creditCardTransactionTable.id })

		const installmentCount = Number(totalInstallments)
		const baseAmount = Math.floor(transactionData.amount / installmentCount)
		const remainder = transactionData.amount - baseAmount * installmentCount

		const installments = Array.from(
			{ length: installmentCount },
			(_, i) => {
				const date = new Date(firstInstallmentDate)
				date.setMonth(date.getMonth() + i)

				return {
					installmentNumber: i + 1,
					amount: baseAmount + (i < remainder ? 1 : 0),
					date: date.toISOString(),
					creditCardTransactionId,
				}
			},
		)

		await tx
			.insert(creditCardTransactionInstallmentTable)
			.values(installments)
	})

	return await redirectWithToast(
		`/app/credit-cards/${creditCardId}`,
		request,
		{
			type: 'success',
			title: 'Transaction created successfully',
		},
	)
}

export default function CreateCreditCardTransaction({
	loaderData: {
		creditCard,
		initialData,
		selectData: { transactionCategories },
	},
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'cc-transaction-form',
		shouldValidate: 'onInput',
		defaultValue: {
			date: initializeDate().toISOString(),
			firstInstallmentDate: initializeDate().toISOString(),
			...initialData,
		},
		constraint: getZodConstraint(CreditCardTransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreditCardTransactionFormSchema,
			})
		},
	})

	const installmentCount = Number(fields.totalInstallments.value) || 1
	const hasInstallments = installmentCount > 1

	const amountValue = Number(removeCommas(fields.amount.value ?? '0'))
	const perInstallmentAmount =
		hasInstallments && amountValue > 0
			? formatNumber(amountValue / installmentCount)
			: null

	const transactionTypeOptions = CC_TRANSACTION_TYPES.map(i => ({
		icon: <TransactionType variant='icon' size='sm' transactionType={i} />,
		value: i,
		label: CC_TRANSACTION_TYPE_LABEL[i],
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
					<CardTitle>Create a transaction</CardTitle>
				</div>
				<CardDescription>
					Record a charge or refund on your {creditCard.brand} ••••{' '}
					{creditCard.last4} card.
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
						label='Transaction Type'
						field={fields.type}
						placeholder='Select a transaction type'
						items={transactionTypeOptions}
					/>

					<div className='grid grid-cols-1 md:grid-cols-5 gap-2'>
						<AmountField
							className='md:col-span-4'
							label='Amount'
							field={fields.amount}
							{...(hasInstallments &&
								amountValue > 0 && {
									description: `${formatNumber(
										amountValue / installmentCount,
										{
											maximumFractionDigits: 2,
										},
									)} per installment`,
								})}
						/>

						<SelectField
							className='md:col-span-1'
							label='Installments'
							field={fields.totalInstallments}
							placeholder='Select installments'
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
						label='Transaction Category'
						field={fields.transactionCategoryId}
						buttonPlaceholder='Select a transaction category'
						options={transactionCategoryOptions}
					/>

					<DateField label='Date' field={fields.date} />

					<DateField
						label={
							hasInstallments
								? 'First Installment Date'
								: 'Charge Date'
						}
						field={fields.firstInstallmentDate}
					/>

					<TextField
						label='Description (Optional)'
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
					Reset
				</Button>
				<Button
					width='full'
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					Create
				</Button>
			</CardFooter>
		</Card>
	)
}
