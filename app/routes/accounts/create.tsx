import { and, eq } from 'drizzle-orm'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFieldsetProps, getFormProps, useForm } from '@conform-to/react'
import { data, Link, Form, useNavigation } from 'react-router'
import { ArrowLeftIcon, PlusIcon, XIcon } from 'lucide-react'
import type { Route } from './+types/create'

import { account, wallet } from '~/database/schema'
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
import { Title } from '~/components/ui/title'
import {
	ErrorList,
	TextField,
	SelectField,
	NumberField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import {
	ACCOUNT_TYPES,
	CURRENCIES,
	ACCOUNT_TYPE_LABEL,
	CURRENCY_DISPLAY,
} from './lib/constants'
import { CreateAccountFormSchema } from './lib/schemas'

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreateAccountFormSchema.superRefine(async (data, ctx) => {
			const existingAccountsCount = await db.$count(
				account,
				and(
					eq(account.ownerId, user.id),
					eq(account.name, data.name),
					eq(account.accountType, data.accountType),
				),
			)
			if (existingAccountsCount > 0) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'An account with this name and type already exists',
				})
			}
		}).transform(data => ({
			...data,
			wallets: data.wallets.map(w => ({
				currency: w.currency,
				balance: Number(removeCommas(w.balance)) * 100,
			})),
		})),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { wallets: walletsData, ...accountData } = submission.value

	const accountId = await db.transaction(async tx => {
		const [{ id: accountId }] = await tx
			.insert(account)
			.values({ ...accountData, ownerId: user.id })
			.returning({ id: account.id })

		await tx
			.insert(wallet)
			.values(walletsData.map(w => ({ ...w, accountId })))

		return accountId
	})

	return await redirectWithToast(`/app/accounts/${accountId}`, request, {
		type: 'success',
		title: 'Account created successfully',
	})
}

export default function CreateAccount({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === '/app/accounts/create' &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-account-form',
		shouldValidate: 'onInput',
		defaultValue: {
			name: '',
			accountType: '',
			description: '',
			wallets: [
				{
					currency: '',
					balance: '0',
				},
			],
		},
		constraint: getZodConstraint(CreateAccountFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CreateAccountFormSchema })
		},
	})

	const wallets = fields.wallets.getFieldList()

	return (
		<>
			<Button asChild variant='link'>
				<Link to='..' relative='path'>
					<ArrowLeftIcon />
					Back
				</Link>
			</Button>
			<div className='flex justify-center'>
				<Card className='md:max-w-2xl w-full'>
					<CardHeader>
						<CardTitle>Create an account</CardTitle>
						<CardDescription>
							Accounts represent your real world accounts where
							your balance is hold. They are used to associate
							transactions and track your finances.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form
							{...getFormProps(form)}
							method='post'
							className='flex flex-col gap-2'
						>
							{/* Have first button to be submit */}
							<button type='submit' className='hidden' />

							<ErrorList
								size='md'
								errors={form.errors}
								id={form.errorId}
							/>

							<TextField
								autoFocus
								label='Name'
								field={fields.name}
							/>
							<TextField
								label='Description'
								field={fields.description}
							/>
							<SelectField
								label='Account Type'
								field={fields.accountType}
								placeholder='Select an option'
								items={ACCOUNT_TYPES.map(i => ({
									icon: (
										<AccountTypeIcon
											size='sm'
											accountType={i}
										/>
									),
									value: i,
									label: ACCOUNT_TYPE_LABEL[i],
								}))}
							/>

							<fieldset
								className='flex flex-col gap-4'
								{...getFieldsetProps(fields.wallets)}
							>
								<div className='flex items-start justify-between'>
									<Title level='h4'>
										Supported Currencies
									</Title>
									<Button
										variant='outline'
										disabled={
											wallets.length === CURRENCIES.length
										}
										{...form.insert.getButtonProps({
											name: fields.wallets.name,
											defaultValue: {
												currency: '',
												balance: '0',
											},
										})}
									>
										<span aria-hidden>
											<PlusIcon />
										</span>
										<span className='sr-only'>
											Add Currency
										</span>
									</Button>
								</div>
								<ErrorList
									size='md'
									id={fields.wallets.errorId}
									errors={fields.wallets.errors}
								/>
								<ul className='flex flex-col gap-2'>
									{wallets.map((w, index) => {
										const { currency, balance } =
											w.getFieldset()

										return (
											<li
												key={w.key}
												className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 pt-6 border rounded-xl relative'
											>
												<SelectField
													label='Currency'
													field={currency}
													placeholder='Select currency'
													items={CURRENCIES.map(
														i => ({
															value: i,
															label: CURRENCY_DISPLAY[
																i
															].label,
															icon: (
																<CurrencyIcon
																	currency={i}
																	size='sm'
																/>
															),
														}),
													)}
												/>

												<NumberField
													label='Balance'
													placeholder='Current balance'
													field={balance}
												/>

												<div className='absolute right-2 top-2'>
													<Button
														variant='destructive-outline'
														size='icon-sm'
														disabled={
															wallets.length === 1
														}
														{...form.remove.getButtonProps(
															{
																name: fields
																	.wallets
																	.name,
																index,
															},
														)}
													>
														<span aria-hidden>
															<XIcon />
														</span>
														<span className='sr-only'>
															Remove currency
														</span>
													</Button>
												</div>
											</li>
										)
									})}
								</ul>
							</fieldset>
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
			</div>
		</>
	)
}

export function meta() {
	return [
		{ title: 'Create an Account | Finhub' },

		{
			property: 'og:title',
			content: 'Create an Account | Finhub',
		},
		{
			name: 'description',
			content: 'Create an account to track your transactions',
		},
	]
}
