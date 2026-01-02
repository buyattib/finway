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
import { exchange as exchangeTable } from '~/database/schema'
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

import { getBalances } from '~/routes/accounts/lib/queries'
import { getSelectData } from '~/routes/transactions/lib/queries'

import { CreateExchangeFormSchema } from './lib/schemas'

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const { accounts, currencies } = await getSelectData(db, user.id)

	return { accounts, currencies }
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
			})
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Account not found',
					path: ['accountId'],
				})
			}

			const fromCurrency = await db.query.currency.findFirst({
				where: (currency, { eq }) =>
					eq(currency.id, data.fromCurrencyId),
				columns: { id: true },
			})
			if (!fromCurrency) {
				return ctx.addIssue({
					code: 'custom',
					message: 'From currency not found',
					path: ['fromCurrencyId'],
				})
			}

			const toCurrency = await db.query.currency.findFirst({
				where: (currency, { eq }) => eq(currency.id, data.toCurrencyId),
				columns: { id: true },
			})
			if (!toCurrency) {
				return ctx.addIssue({
					code: 'custom',
					message: 'to currency not found',
					path: ['toCurrencyId'],
				})
			}

			const [result] = await getBalances(
				db,
				user.id,
				data.accountId,
				data.fromCurrencyId,
				false,
			)
			if (!result || result.balance < data.fromAmount) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'Insufficient balance in the selected from currency',
					path: ['fromAmount'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	await db.insert(exchangeTable).values(submission.value)

	return await redirectWithToast(`/app/exchanges`, request, {
		type: 'success',
		title: 'Exchange created successfully',
	})
}

export default function CreateExchange({
	loaderData: { accounts, currencies },
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
			fromCurrencyId: '',
			toCurrencyId: '',
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

	const currencyOptions = currencies.map(c => ({
		icon: <CurrencyIcon currency={c.code} size='sm' />,
		value: c.id,
		label: c.code,
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
									field={fields.fromCurrencyId}
									placeholder='Select a currency'
									items={currencyOptions}
								/>
								<SelectField
									label='To Currency'
									field={fields.toCurrencyId}
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
