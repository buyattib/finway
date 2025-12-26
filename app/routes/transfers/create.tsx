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
import { eq } from 'drizzle-orm'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import {
	wallet as walletTable,
	transfer as transferTable,
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
	SelectField,
	NumberField,
	DateField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import type { TCurrency } from '~/routes/accounts/lib/types'

import { CreateTransferFormSchema } from './lib/schemas'

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
				columns: { currency: true },
			},
		},
	})

	const accounts = accountsResult.map(account => ({
		id: account.id,
		name: account.name,
		accountType: account.accountType,
	}))
	const currenciesPerAccount = accountsResult.reduce(
		(acc, account) => {
			acc[account.id] = account.wallets.map(w => w.currency)
			return acc
		},
		{} as Record<string, Array<TCurrency>>,
	)

	return { accounts, currenciesPerAccount }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreateTransferFormSchema.transform(data => ({
			...data,
			amount: Number(removeCommas(data.amount)) * 100,
		})).superRefine(async (data, ctx) => {
			const fromAccount = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.fromAccountId),
				columns: { ownerId: true },
				with: {
					wallets: {
						columns: { id: true, balance: true, currency: true },
					},
				},
			})
			const toAccount = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.toAccountId),
				columns: { ownerId: true },
				with: {
					wallets: {
						columns: { id: true, balance: true, currency: true },
					},
				},
			})

			if (!fromAccount || fromAccount.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'From account not found',
					path: ['fromAccountId'],
				})
			}

			if (!toAccount || toAccount.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'To account not found',
					path: ['toAccountId'],
				})
			}

			const fromWallet = fromAccount.wallets.find(
				w => w.currency === data.currency,
			)
			const toWallet = toAccount.wallets.find(
				w => w.currency === data.currency,
			)

			if (!fromWallet || !toWallet) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency is not supported by one of the accounts',
					path: ['currency'],
				})
			}

			if (fromWallet.balance < data.amount) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'Insufficient balance in the selected from account',
					path: ['amount'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	await db.transaction(async tx => {
		const fromWallet = (await tx.query.wallet.findFirst({
			where: (wallet, { eq, and }) =>
				and(
					eq(wallet.accountId, body.fromAccountId),
					eq(wallet.currency, body.currency),
				),
			columns: { id: true, balance: true },
		}))!

		const toWallet = (await tx.query.wallet.findFirst({
			where: (wallet, { eq, and }) =>
				and(
					eq(wallet.accountId, body.toAccountId),
					eq(wallet.currency, body.currency),
				),
			columns: { id: true, balance: true },
		}))!

		await tx.insert(transferTable).values(body)

		await tx
			.update(walletTable)
			.set({ balance: fromWallet.balance - body.amount })
			.where(eq(walletTable.id, fromWallet.id))

		await tx
			.update(walletTable)
			.set({ balance: toWallet.balance + body.amount })
			.where(eq(walletTable.id, toWallet.id))
	})
	return await redirectWithToast(`/app/transfers`, request, {
		type: 'success',
		title: 'Transfer created successfully',
	})
}

export default function CreateTransfer({
	loaderData: { accounts, currenciesPerAccount },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transfer-form',
		shouldValidate: 'onInput',
		defaultValue: {
			date: initializeDate().toISOString(),
			amount: '0',
			currency: '',
			fromAccountId: '',
			toAccountId: '',
		},
		constraint: getZodConstraint(CreateTransferFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreateTransferFormSchema,
			})
		},
	})

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='sm' />,
		value: id,
		label: name,
	}))

	const selectedFromAccountId = fields.fromAccountId.value
	const selectedToAccountId = fields.toAccountId.value

	const fromCurrencies = selectedFromAccountId
		? currenciesPerAccount[selectedFromAccountId]
		: []
	const toCurrencies = selectedToAccountId
		? currenciesPerAccount[selectedToAccountId]
		: []

	const currencyOptions = fromCurrencies
		.filter(c => toCurrencies.includes(c))
		.map(c => ({
			icon: <CurrencyIcon currency={c} size='sm' />,
			value: c,
			label: c,
		}))

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to='..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>Create a transfer</CardTitle>
				</div>
				<CardDescription>
					Transfers will affect your account balances and used to
					track your finances.
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

					{accounts.length !== 0 ? (
						<>
							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<SelectField
									label='From Account'
									field={fields.fromAccountId}
									placeholder='Select an account'
									items={accountOptions}
								/>

								<SelectField
									label='To Account'
									field={fields.toAccountId}
									placeholder='Select an account'
									items={accountOptions}
								/>
							</div>

							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<SelectField
									label='Currency'
									field={fields.currency}
									placeholder='Select a currency'
									items={currencyOptions}
								/>
								<NumberField
									label='Amount'
									field={fields.amount}
								/>
							</div>
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
