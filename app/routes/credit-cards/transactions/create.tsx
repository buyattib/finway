import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { creditCardTransaction as creditCardTransactionTable } from '~/database/schema'
import { removeCommas, initializeDate } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import {
	ACTION_CREATION,
	CC_TRANSACTION_TYPE_CHARGE,
	CC_TRANSACTION_TYPES,
	CC_TRANSACTION_TYPE_DISPLAY,
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

	const { action, creditCardId, ...transactionData } = submission.value

	await db.insert(creditCardTransactionTable).values({
		...transactionData,
		creditCardId,
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
			...initialData,
		},
		constraint: getZodConstraint(CreditCardTransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreditCardTransactionFormSchema,
			})
		},
	})

	const transactionTypeOptions = CC_TRANSACTION_TYPES.map(i => {
		const { icon: Icon, label, color } = CC_TRANSACTION_TYPE_DISPLAY[i]
		return {
			icon: <Icon className={`w-4 h-4 text-${color}`} />,
			value: i,
			label,
		}
	})

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

					<AmountField label='Amount' field={fields.amount} />

					<ComboboxField
						label='Transaction Category'
						field={fields.transactionCategoryId}
						buttonPlaceholder='Select a transaction category'
						options={transactionCategoryOptions}
					/>

					<DateField label='Date' field={fields.date} />

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
