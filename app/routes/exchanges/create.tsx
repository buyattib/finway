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
	ComboboxField,
	AmountField,
	DateField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getSelectData, getBalances, getCurrencyById } from '~/lib/queries'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { getExchangeBalance, createExchange } from './lib/queries'
import { createExchangeFormSchema } from './lib/schemas'

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
	const t = getServerT(context, 'exchanges')

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
	const t = getServerT(context, 'exchanges')

	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: createExchangeFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { accountId, fromCurrencyId, toCurrencyId } = submission.value
	const fromAmount = Number(removeCommas(submission.value.fromAmount)) * 100
	const toAmount = Number(removeCommas(submission.value.toAmount)) * 100

	const account = await getAccountById({ db, accountId })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						accountId: [t('form.create.action.accountNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const fromCurrency = await getCurrencyById({
		db,
		currencyId: fromCurrencyId,
	})
	if (!fromCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromCurrencyId: [
							t('form.create.action.fromCurrencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const toCurrency = await getCurrencyById({ db, currencyId: toCurrencyId })
	if (!toCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						toCurrencyId: [
							t('form.create.action.toCurrencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const balance = await getExchangeBalance({
		db,
		ownerId: user.id,
		accountId,
		currencyId: fromCurrencyId,
	})
	if (!balance || balance.balance < fromAmount) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromAmount: [
							t('form.create.action.insufficientBalance'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await createExchange({
		db,
		values: {
			date: submission.value.date,
			fromAmount,
			toAmount,
			fromCurrencyId,
			toCurrencyId,
			accountId,
		},
	})

	return await redirectWithToast(`/app/exchanges`, request, {
		type: 'success',
		title: t('form.create.action.successToast'),
	})
}

export default function CreateExchange({
	loaderData: { accounts, currencies, balances },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation('exchanges')

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const schema = createExchangeFormSchema(t)

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-exchange-form',
		shouldValidate: 'onBlur',
		defaultValue: {
			date: initializeDate().toISOString(),
			fromAmount: '0',
			toAmount: '0',
			fromCurrencyId: '',
			toCurrencyId: '',
			accountId: '',
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
			b.accountId === fields.accountId.value &&
			b.currencyId === fields.fromCurrencyId.value,
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
							<ComboboxField
								label={t('form.accountLabel')}
								field={fields.accountId}
								buttonPlaceholder={t('form.accountPlaceholder')}
								options={accountOptions}
							/>
							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
								<ComboboxField
									label={t('form.fromCurrencyLabel')}
									field={fields.fromCurrencyId}
									buttonPlaceholder={t(
										'form.currencyPlaceholder',
									)}
									options={currencyOptions}
								/>
								<ComboboxField
									label={t('form.toCurrencyLabel')}
									field={fields.toCurrencyId}
									buttonPlaceholder={t(
										'form.currencyPlaceholder',
									)}
									options={currencyOptions}
								/>
							</div>

							<AmountField
								label={t('form.fromAmountLabel')}
								field={fields.fromAmount}
								description={balanceDescription}
								maxValue={selectedBalance?.balance}
							/>

							<AmountField
								label={t('form.toAmountLabel')}
								field={fields.toAmount}
							/>
						</>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							<Trans
								i18nKey='form.noAccountMessage'
								ns='exchanges'
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
