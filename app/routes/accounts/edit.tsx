import { and, eq, ne, inArray } from 'drizzle-orm'
import { data, Link, Form, useNavigation } from 'react-router'
import {
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeftIcon, PlusIcon, XIcon } from 'lucide-react'

import type { Route } from './+types/edit'

import {
	account as accountSchema,
	wallet as walletSchema,
} from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { removeCommas } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Title } from '~/components/ui/title'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import {
	ErrorList,
	TextField,
	SelectField,
	NumberField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { getAccount } from './lib/queries'
import {
	CURRENCIES,
	ACCOUNT_TYPES,
	ACCOUNT_TYPE_LABEL,
	CURRENCY_DISPLAY,
} from './lib/constants'
import { EditAccountFormSchema } from './lib/schemas'

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const account = await getAccount(db, accountId)
	if (!account || account.ownerId !== user.id) {
		throw new Response('Account not found', { status: 404 })
	}

	const { ownerId, ...accountData } = account
	return {
		account: {
			...accountData,
			wallets: account.wallets.map(w => ({
				...w,
				balance: String(w.balance / 100),
			})),
		},
	}
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: EditAccountFormSchema.superRefine(async (data, ctx) => {
			const account = await getAccount(db, data.id)
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: `Account with id ${data.id} not found`,
				})
			}

			const existingAccountsCount = await db.$count(
				accountSchema,
				and(
					eq(accountSchema.ownerId, user.id),
					eq(accountSchema.name, data.name),
					eq(accountSchema.accountType, data.accountType),
					ne(accountSchema.id, data.id),
				),
			)
			if (existingAccountsCount > 0) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'An account with this name and type already exists',
				})
			}
		}).transform(async ({ wallets, ...accountData }) => {
			const accountWallets = await db.query.wallet.findMany({
				columns: { id: true },
				where: (walletSchema, { eq }) =>
					eq(walletSchema.accountId, accountData.id),
			})

			const toCreate = wallets
				.filter(w => !w.id)
				.map(w => ({
					currency: w.currency,
					balance: Number(removeCommas(w.balance)) * 100,
					accountId: accountData.id,
				}))
			const toDelete = accountWallets
				.filter(w => !wallets.find(_w => _w.id === w.id))
				.map(w => w.id)

			return {
				...accountData,
				toCreate,
				toDelete,
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { toCreate, toDelete, ...accountData } = submission.value

	await db.transaction(async tx => {
		await tx
			.update(accountSchema)
			.set(accountData)
			.where(eq(accountSchema.id, accountData.id))

		if (toCreate.length > 0) {
			await tx.insert(walletSchema).values(toCreate)
		}
		if (toDelete.length > 0) {
			await tx
				.delete(walletSchema)
				.where(inArray(walletSchema.id, toDelete))
		}
	})

	return await redirectWithToast(`/app/accounts/${accountData.id}`, request, {
		type: 'success',
		title: 'Account updated successfully',
	})
}

export default function EditAccount({
	loaderData: { account },
	actionData,
}: Route.ComponentProps) {
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === `/app/accounts/${account.id}/edit` &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'edit-account-form',
		shouldValidate: 'onInput',
		defaultValue: account,
		constraint: getZodConstraint(EditAccountFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: EditAccountFormSchema })
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
						<CardTitle>Update account</CardTitle>
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

							{/* Add the account id to the form if there is one  */}
							<input type='hidden' name='id' value={account.id} />

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
										const { currency, balance, id } =
											w.getFieldset()

										return (
											<li
												key={w.key}
												className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 pt-6 border rounded-xl relative'
											>
												<input
													{...getInputProps(id, {
														type: 'hidden',
													})}
												/>

												<SelectField
													label='Currency'
													field={currency}
													placeholder='Select currency'
													disabled={!!id.value}
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

												{/* Disabled inputs are not included in forms, add hidden one for edition */}
												{id.value && (
													<input
														{...getInputProps(
															balance,
															{ type: 'hidden' },
														)}
													/>
												)}
												<NumberField
													label='Balance'
													placeholder='Current balance'
													field={balance}
													disabled={!!id.value}
												/>

												<div className='absolute right-2 top-2'>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant='destructive-outline'
																size='icon-sm'
																disabled={
																	wallets.length ===
																	1
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
																<span
																	aria-hidden
																>
																	<XIcon />
																</span>
																<span className='sr-only'>
																	Remove
																	currency
																</span>
															</Button>
														</TooltipTrigger>
														{!!id.value && (
															<TooltipContent>
																Removing the
																currency will
																delete all the
																transactions
																associated with
																it and the
																balance.
															</TooltipContent>
														)}
													</Tooltip>
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
							form={form.id}
							type='submit'
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							Update
						</Button>
					</CardFooter>
				</Card>
			</div>
		</>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>
						Account with id <b>{params.accountId}</b> not found.
					</p>
				),
			}}
		/>
	)
}
