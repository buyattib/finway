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
import { transfer as transferTable } from '~/database/schema'
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
	NumberField,
	DateField,
	ComboboxField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { getBalances } from '~/routes/accounts/lib/queries'
import { getSelectData } from '~/routes/transactions/lib/queries'

import { CreateTransferFormSchema } from './lib/schemas'

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
		schema: CreateTransferFormSchema.transform(data => ({
			...data,
			amount: Number(removeCommas(data.amount)) * 100,
		})).superRefine(async (data, ctx) => {
			const fromAccount = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.fromAccountId),
				columns: { ownerId: true },
			})
			const toAccount = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.toAccountId),
				columns: { ownerId: true },
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

			const currency = await db.query.currency.findFirst({
				where: (currency, { eq }) => eq(currency.id, data.currencyId),
				columns: { id: true },
			})
			if (!currency) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency not found',
					path: ['currencyId'],
				})
			}

			const [result] = await getBalances(
				db,
				user.id,
				data.fromAccountId,
				data.currencyId,
				false,
			)
			if (!result || result.balance < data.amount) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'Insufficient balance in the selected currency on the from account',
					path: ['amount'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	await db.insert(transferTable).values(submission.value)

	return await redirectWithToast(`/app/transfers`, request, {
		type: 'success',
		title: 'Transfer created successfully',
	})
}

export default function CreateTransfer({
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
		id: 'create-transfer-form',
		shouldValidate: 'onInput',
		defaultValue: {
			date: initializeDate().toISOString(),
			amount: '0',
			currencyId: '',
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
								<ComboboxField
									label='From Account'
									field={fields.fromAccountId}
									buttonPlaceholder='Select an account'
									options={accountOptions}
								/>

								<ComboboxField
									label='To Account'
									field={fields.toAccountId}
									buttonPlaceholder='Select an account'
									options={accountOptions}
								/>
							</div>

							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<ComboboxField
									label='Currency'
									field={fields.currencyId}
									buttonPlaceholder='Select a currency'
									options={currencyOptions}
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
