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
	exchange as exchangeTable,
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

import { CreateExchangeFormSchema } from './lib/schemas'

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
		schema: CreateExchangeFormSchema.transform(data => ({
			...data,
			fromAmount: Number(removeCommas(data.fromAmount)) * 100,
			toAmount: Number(removeCommas(data.toAmount)) * 100,
		})).superRefine(async (data, ctx) => {
			const account = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.accountId),
				columns: { ownerId: true },
				with: {
					wallets: {
						columns: { id: true, balance: true, currency: true },
					},
				},
			})
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Account not found',
					path: ['accountId'],
				})
			}

			const fromWallet = account.wallets.find(
				w => w.currency === data.fromCurrency,
			)
			const toWallet = account.wallets.find(
				w => w.currency === data.toCurrency,
			)

			if (!fromWallet || !toWallet) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency is not supported by one of the accounts',
				})
			}

			if (fromWallet.balance < data.fromAmount) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Insufficient balance in the selected currency',
					path: ['fromAmount'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	await db.transaction(async tx => {
		const account = (await tx.query.account.findFirst({
			where: (account, { eq }) => eq(account.id, body.accountId),
			columns: {},
			with: {
				wallets: {
					columns: { id: true, balance: true, currency: true },
				},
			},
		}))!

		const fromWallet = account.wallets.find(
			w => w.currency === body.fromCurrency,
		)!
		const toWallet = account.wallets.find(
			w => w.currency === body.toCurrency,
		)!

		await tx.insert(exchangeTable).values(body)

		await tx
			.update(walletTable)
			.set({ balance: fromWallet.balance - body.fromAmount })
			.where(eq(walletTable.id, fromWallet.id))

		await tx
			.update(walletTable)
			.set({ balance: toWallet.balance + body.toAmount })
			.where(eq(walletTable.id, toWallet.id))
	})

	return await redirectWithToast(`/app/exchanges`, request, {
		type: 'success',
		title: 'Exchange created successfully',
	})
}

export default function CreateExchange({
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
		id: 'create-exchange-form',
		shouldValidate: 'onInput',
		defaultValue: {
			date: initializeDate().toISOString(),
			fromAmount: '0',
			toAmount: '0',
			fromCurrency: '',
			toCurrency: '',
			accountId: '',
		},
		constraint: getZodConstraint(CreateExchangeFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreateExchangeFormSchema,
			})
		},
	})

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='sm' />,
		value: id,
		label: name,
	}))

	const selectedAccount = fields.accountId.value

	const currencyOptions = selectedAccount
		? currenciesPerAccount[selectedAccount].map(c => ({
				icon: <CurrencyIcon currency={c} size='sm' />,
				value: c,
				label: c,
			}))
		: []

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to='..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>Create an exchange</CardTitle>
				</div>
				<CardDescription>
					Exchanges will affect your account balances and be used to
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
							<SelectField
								label='Account'
								field={fields.accountId}
								placeholder='Select an account'
								items={accountOptions}
							/>
							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<SelectField
									label='From Currency'
									field={fields.fromCurrency}
									placeholder='Select a currency'
									items={currencyOptions}
								/>
								<SelectField
									label='To Currency'
									field={fields.toCurrency}
									placeholder='Select a currency'
									items={currencyOptions}
								/>
							</div>

							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<NumberField
									label='From Amount'
									field={fields.fromAmount}
								/>
								<NumberField
									label='To Amount'
									field={fields.toAmount}
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
