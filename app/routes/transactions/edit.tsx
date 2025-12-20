import {
	data,
	Link,
	Form,
	useNavigation,
	createSearchParams,
	useLocation,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import { eq, sql } from 'drizzle-orm'
import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import {
	transaction as transactionTable,
	wallet as walletTable,
	account as accountTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import { initializeDate, removeCommas } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import {
	ErrorList,
	TextField,
	SelectField,
	NumberField,
	DateField,
} from '~/components/forms'
import { TransactionTypeIcon } from '~/components/transaction-type-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { EditTransactionFormSchema } from './lib/schemas'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_DISPLAY,
	TRANSACTION_TYPE_INCOME,
} from './lib/constants'

export async function loader({
	context,
	params: { transactionId },
}: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const transaction = await db.query.transaction.findFirst({
		where: (transaction, { eq }) => eq(transaction.id, transactionId),
		columns: {
			id: true,
			date: true,
			amount: true,
			type: true,
			description: true,
			transactionCategoryId: true,
			walletId: true,
		},
		extras: {
			amount: sql<string>`CAST(${transactionTable.amount} / 100 AS TEXT)`.as(
				'amount',
			),
		},
		with: {
			wallet: {
				columns: {},
				with: {
					account: {
						columns: {
							id: true,
							ownerId: true,
						},
					},
				},
			},
		},
	})

	if (!transaction || transaction.wallet.account.ownerId !== user.id) {
		throw new Response('Transaction not found', { status: 404 })
	}

	const accountsResult = await db.query.account.findMany({
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		where: (account, { eq }) => eq(account.ownerId, user.id),
		columns: { id: true, name: true, accountType: true },
		with: {
			wallets: {
				orderBy: (wallet, { desc }) => [desc(wallet.balance)],
				columns: { id: true, currency: true },
			},
		},
	})

	const accounts = accountsResult.map(account => ({
		id: account.id,
		name: account.name,
		accountType: account.accountType,
	}))
	const walletsPerAccount = accountsResult.reduce(
		(acc, account) => {
			acc[account.id] = account.wallets
			return acc
		},
		{} as Record<string, (typeof accountsResult)[number]['wallets']>,
	)

	const transactionCategories = await db.query.transactionCategory.findMany({
		orderBy: (transactionCategory, { desc }) => [
			desc(transactionCategory.createdAt),
		],
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.ownerId, user.id),
		columns: { id: true, name: true, description: true },
	})

	const { wallet, ...transactionData } = transaction

	return {
		transaction: { ...transactionData, accountId: wallet.account.id },

		accounts,
		walletsPerAccount,
		transactionCategories,
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: EditTransactionFormSchema.transform(data => ({
			...data,
			amount: Number(removeCommas(data.amount)) * 100,
		})).superRefine(async (data, ctx) => {
			// Existing transaction
			const transaction = await db.query.transaction.findFirst({
				where: (transaction, { eq }) => eq(transaction.id, data.id),
				columns: {
					type: true,
					amount: true,
				},
				with: {
					wallet: {
						columns: { id: true, balance: true },
						with: {
							account: {
								columns: { id: true, ownerId: true },
							},
						},
					},
				},
			})
			if (
				!transaction ||
				transaction.wallet.account.ownerId !== user.id
			) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Transaction not found',
				})
			}

			// New account
			const account = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.accountId),
				columns: { ownerId: true },
				with: { wallets: { columns: { id: true, balance: true } } },
			})
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Account not found',
					path: ['accountId'],
				})
			}

			// New wallet
			const wallet = account.wallets.find(w => w.id === data.walletId)
			if (!wallet) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency not found for selected account',
					path: ['walletId'],
				})
			}

			// Balance of the account before the transaction
			let previousBalance = wallet.balance
			if (transaction.wallet.id === data.walletId) {
				previousBalance += {
					[TRANSACTION_TYPE_EXPENSE]: transaction.amount,
					[TRANSACTION_TYPE_INCOME]: -transaction.amount,
				}[transaction.type]
			}

			if (
				data.type === TRANSACTION_TYPE_EXPENSE &&
				previousBalance < data.amount
			) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'Insufficient balance in the selected currency account',
					path: ['amount'],
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

	const {
		accountId,
		id: transactionId,
		...transactionData
	} = submission.value

	await db.transaction(async tx => {
		const transaction = (await db.query.transaction.findFirst({
			where: (transaction, { eq }) => eq(transaction.id, transactionId),
			columns: {
				type: true,
				amount: true,
			},
			with: {
				wallet: { columns: { id: true, balance: true } },
			},
		}))!

		// Revert previous transaction
		const previousBalance =
			transaction.wallet.balance +
			{
				[TRANSACTION_TYPE_EXPENSE]: transaction.amount,
				[TRANSACTION_TYPE_INCOME]: -transaction.amount,
			}[transaction.type]
		await tx
			.update(walletTable)
			.set({ balance: previousBalance })
			.where(eq(walletTable.id, transaction.wallet.id))

		await tx
			.update(transactionTable)
			.set(transactionData)
			.where(eq(transactionTable.id, transactionId))

		// Apply new transaction changes to new wallet
		const wallet = (await tx.query.wallet.findFirst({
			where: (wallet, { eq }) => eq(wallet.id, transactionData.walletId),
			columns: { balance: true },
		}))!
		const updatedBalance =
			wallet.balance +
			{
				[TRANSACTION_TYPE_EXPENSE]: -transactionData.amount,
				[TRANSACTION_TYPE_INCOME]: transactionData.amount,
			}[transactionData.type]
		await tx
			.update(walletTable)
			.set({ balance: updatedBalance })
			.where(eq(walletTable.id, transactionData.walletId))
	})

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: 'Transaction created successfully',
	})
}

export default function CreateTransaction({
	loaderData: {
		transaction,

		accounts,
		walletsPerAccount,
		transactionCategories,
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
		id: 'edit-transaction-form',
		shouldValidate: 'onInput',
		defaultValue: transaction,
		constraint: getZodConstraint(EditTransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: EditTransactionFormSchema,
			})
		},
	})

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: <TransactionTypeIcon size='sm' transactionType={i} />,
		value: i,
		label: TRANSACTION_TYPE_DISPLAY[i].label,
	}))

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='sm' />,
		value: id,
		label: name,
	}))

	const selectedAccountId = fields.accountId.value

	const walletOptions = !selectedAccountId
		? []
		: walletsPerAccount[selectedAccountId].map(({ id, currency }) => ({
				icon: <CurrencyIcon currency={currency} size='sm' />,
				value: id,
				label: currency,
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
						<Link to='..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>Create a transaction</CardTitle>
				</div>
				<CardDescription>
					Incomes and expenses will affect your account balances and
					used to track your finances.
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

					<input type='hidden' name='id' value={transaction.id} />

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>

					<SelectField
						label='Transaction Type'
						field={fields.type}
						placeholder='Select an transaction type'
						items={transactionTypeOptions}
					/>

					{accounts.length !== 0 ? (
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<SelectField
								label='Account'
								field={fields.accountId}
								placeholder='Select an account'
								items={accountOptions}
							/>

							<SelectField
								label='Currency'
								field={fields.walletId}
								placeholder='Select a currency'
								items={walletOptions}
							/>
						</div>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							You need to create an account first. Do it{' '}
							<Link
								to={{
									pathname: '/app/accounts/create',
									search: createSearchParams({
										redirectTo: location.pathname,
									}).toString(),
								}}
								className='text-primary'
							>
								here
							</Link>
						</Text>
					)}

					<NumberField label='Amount' field={fields.amount} />

					{transactionCategories.length !== 0 ? (
						<SelectField
							label='Transaction Category'
							field={fields.transactionCategoryId}
							placeholder='Select a transaction category'
							items={transactionCategoryOptions}
						/>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							You need to create a transaction category first. Do
							it{' '}
							<Link
								to={{
									pathname:
										'/app/transaction-categories/create',
									search: createSearchParams({
										redirectTo: location.pathname,
									}).toString(),
								}}
								className='text-primary'
							>
								here
							</Link>
						</Text>
					)}

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
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					Edit
				</Button>
			</CardFooter>
		</Card>
	)
}
