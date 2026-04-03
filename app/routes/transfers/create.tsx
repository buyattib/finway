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
import { Trans, useTranslation } from 'react-i18next'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { initializeDate, removeCommas } from '~/lib/utils'
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
import { Text } from '~/components/ui/text'
import {
	ErrorList,
	AmountField,
	DateField,
	ComboboxField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getBalances } from '~/lib/queries'

import { getAccountById } from '~/routes/accounts/lib/queries'

import {
	getCurrencyById,
	getTransferBalance,
	createTransfer,
} from './lib/queries'
import { createTransferFormSchema } from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transfers')

	const [{ accounts, currencies }, balances] = await Promise.all([
		getSelectData(db, user.id),
		getBalances({ db, ownerId: user.id, parseBalance: true }),
	])

	return {
		accounts,
		currencies,
		balances,
		meta: {
			title: t('form.create.meta.title'),
			description: t('form.create.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transfers')

	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: createTransferFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { fromAccountId, toAccountId, currencyId } = submission.value
	const amount = Number(removeCommas(submission.value.amount)) * 100

	const fromAccount = await getAccountById({ db, accountId: fromAccountId })
	if (!fromAccount || fromAccount.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromAccountId: [
							t('form.create.action.fromAccountNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const toAccount = await getAccountById({ db, accountId: toAccountId })
	if (!toAccount || toAccount.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						toAccountId: [
							t('form.create.action.toAccountNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const currency = await getCurrencyById({ db, currencyId })
	if (!currency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						currencyId: [t('form.create.action.currencyNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const balance = await getTransferBalance({
		db,
		ownerId: user.id,
		accountId: fromAccountId,
		currencyId,
	})
	if (!balance || balance.balance < amount) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						amount: [t('form.create.action.insufficientBalance')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await createTransfer({
		db,
		values: {
			date: submission.value.date,
			amount,
			currencyId,
			fromAccountId,
			toAccountId,
		},
	})

	return await redirectWithToast(`/app/transfers`, request, {
		type: 'success',
		title: t('form.create.action.successToast'),
	})
}

export default function CreateTransfer({
	loaderData: { accounts, currencies, balances },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation('transfers')

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const schema = createTransferFormSchema(t)

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transfer-form',
		shouldValidate: 'onBlur',
		defaultValue: {
			date: initializeDate().toISOString(),
			amount: '0',
			currencyId: '',
			fromAccountId: '',
			toAccountId: '',
		},
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema,
			})
		},
	})

	const selectedBalance = balances.find(
		b =>
			b.accountId === fields.fromAccountId.value &&
			b.currencyId === fields.currencyId.value,
	)

	const balanceDescription = selectedBalance
		? t('form.availableBalance', {
				symbol: getCurrencySymbol(selectedBalance.currency),
				amount: formatNumber(selectedBalance.balance),
				currency: selectedBalance.currency,
			})
		: undefined

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
					<CardTitle>{t('form.create.title')}</CardTitle>
				</div>
				<CardDescription>{t('form.description')}</CardDescription>
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

					<DateField
						label={t('form.dateLabel')}
						field={fields.date}
					/>

					{accounts.length !== 0 ? (
						<>
							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<ComboboxField
									label={t('form.fromAccountLabel')}
									field={fields.fromAccountId}
									buttonPlaceholder={t(
										'form.accountPlaceholder',
									)}
									options={accountOptions}
								/>

								<ComboboxField
									label={t('form.toAccountLabel')}
									field={fields.toAccountId}
									buttonPlaceholder={t(
										'form.accountPlaceholder',
									)}
									options={accountOptions}
								/>
							</div>

							<ComboboxField
								label={t('form.currencyLabel')}
								field={fields.currencyId}
								buttonPlaceholder={t(
									'form.currencyPlaceholder',
								)}
								options={currencyOptions}
							/>

							<AmountField
								label={t('form.amountLabel')}
								field={fields.amount}
								description={balanceDescription}
							/>
						</>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							<Trans
								i18nKey='form.noAccountMessage'
								ns='transfers'
								components={[
									<Link
										key='0'
										to={{
											pathname: '/app/accounts/create',
											search: createSearchParams({
												redirectTo: location.pathname,
											}).toString(),
										}}
										className='text-primary'
									/>,
								]}
							/>
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
					{t('form.resetButton')}
				</Button>
				<Button
					width='full'
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{t('form.create.submitButton')}
				</Button>
			</CardFooter>
		</Card>
	)
}
