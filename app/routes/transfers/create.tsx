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

import { transfer as transferTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { initializeDate, removeCommas } from '~/lib/utils'
import { getBalances, getSelectData } from '~/lib/queries'

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

	const { accounts, currencies } = await getSelectData(db, user.id)

	return {
		accounts,
		currencies,
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

	const submission = await parseWithZod(formData, {
		async: true,
		schema: createTransferFormSchema(t)
			.transform(data => ({
				...data,
				amount: Number(removeCommas(data.amount)) * 100,
			}))
			.superRefine(async (data, ctx) => {
				const fromAccount = await db.query.account.findFirst({
					where: (account, { eq }) =>
						eq(account.id, data.fromAccountId),
					columns: { ownerId: true },
				})
				const toAccount = await db.query.account.findFirst({
					where: (account, { eq }) =>
						eq(account.id, data.toAccountId),
					columns: { ownerId: true },
				})

				if (!fromAccount || fromAccount.ownerId !== user.id) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.fromAccountNotFound'),
						path: ['fromAccountId'],
					})
				}

				if (!toAccount || toAccount.ownerId !== user.id) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.toAccountNotFound'),
						path: ['toAccountId'],
					})
				}

				const currency = await db.query.currency.findFirst({
					where: (currency, { eq }) =>
						eq(currency.id, data.currencyId),
					columns: { id: true },
				})
				if (!currency) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.currencyNotFound'),
						path: ['currencyId'],
					})
				}

				const { fromAccountId: accountId, currencyId } = data
				const [result] = await getBalances({
					db,
					ownerId: user.id,
					accountId,
					currencyId,
					parseBalance: false,
				})
				if (!result || result.balance < data.amount) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.insufficientBalance'),
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
		title: t('form.create.action.successToast'),
	})
}

export default function CreateTransfer({
	loaderData: { accounts, currencies },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['transfers', 'components'])

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

							<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
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
								/>
							</div>
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
