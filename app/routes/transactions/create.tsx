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
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { removeCommas } from '~/lib/utils'
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

import { CreateTransactionFormSchema } from './lib/schemas'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_DISPLAY,
} from './lib/constants'

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

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

	const initialAccount = accounts[0]
	const initialAccountId = initialAccount?.id || ''
	const initialWallet = walletsPerAccount[initialAccountId]?.[0]
	const initialWalletId = initialWallet?.id || ''

	return {
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
		schema: CreateTransactionFormSchema.superRefine(
			async (data, ctx) => {},
		).transform(data => data),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	console.log(submission.value)

	const transactionId = ''

	return await redirectWithToast(
		`/app/transactions/${transactionId}`,
		request,
		{
			type: 'success',
			title: 'Transaction created successfully',
		},
	)
}

export default function CreateTransaction({
	loaderData: { accounts, walletsPerAccount, transactionCategories },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const initialAccount = accounts[0]
	const initialAccountId = initialAccount?.id || ''
	const initialWallet = walletsPerAccount[initialAccountId]?.[0]
	const initialWalletId = initialWallet?.id || ''

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transaction-form',
		shouldValidate: 'onInput',
		defaultValue: {
			date: new Date().toISOString(),
			type: TRANSACTION_TYPE_EXPENSE,
			amount: '0',
			description: '',
			accountId: '',
			walletId: '',
			transactionCategoryId: '',
		},
		constraint: getZodConstraint(CreateTransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreateTransactionFormSchema,
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

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>

					<DateField label='Date' field={fields.date} />

					<TextField
						label='Description (Optional)'
						field={fields.description}
					/>
					<SelectField
						label='Transaction Type'
						field={fields.type}
						placeholder='Select an transaction type'
						items={transactionTypeOptions}
					/>

					<NumberField label='Amount' field={fields.amount} />

					{accounts.length !== 0 ? (
						<>
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
						</>
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
