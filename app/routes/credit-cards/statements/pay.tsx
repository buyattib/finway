import { Form, useNavigate, useNavigation } from 'react-router'
import { data } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm, getFormProps } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/pay'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getBalances, getSelectData } from '~/lib/queries'
import { formatNumber, getCurrencySymbol, initializeDate } from '~/lib/utils'
import type { TCurrency } from '~/lib/types'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'
import { DateField, SelectField } from '~/components/forms'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '~/components/ui/dialog'

import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'
import { getAccountById } from '~/routes/accounts/lib/queries'

import { payStatementFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'
import { payStatement } from '../lib/queries'
import { validateStatementPayment } from '../lib/services'

export async function loader({
	context,
	request,
	params: { statementId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const { payments } = await validateStatementPayment({
		context,
		request,
		statementId,
	})
	const { accounts } = await getSelectData(db, user.id)

	return {
		accounts: accounts.map(a => ({ id: a.id, name: a.name })),
		owed: payments.map(p => ({
			currencyId: p.currencyId,
			currencyCode: p.currencyCode,
			amount: String(p.amountCents / 100),
		})),
	}
}

export async function action({
	request,
	context,
	params: { statementId },
}: Route.ActionArgs) {
	const t = getServerT(context, 'credit-cards')
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const { creditCard } = context.get(creditCardContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: payStatementFormSchema(t),
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { payments } = await validateStatementPayment({
		context,
		request,
		statementId,
	})

	const { fromAccountId, date } = submission.value

	const fromAccount = await getAccountById({
		db,
		accountId: fromAccountId,
	})
	if (
		!fromAccount ||
		fromAccount.ownerId !== user.id ||
		fromAccount.accountType === ACCOUNT_TYPE_CREDIT_CARD
	) {
		return await redirectWithToast('..', request, {
			type: 'error',
			title: t('statement.payment.action.fromAccountNotFound'),
		})
	}

	const balances = await getBalances({
		db,
		ownerId: user.id,
		accountId: fromAccount.id,
		parseBalance: false,
	})
	const balanceByCurrency = new Map(
		balances.map(b => [b.currencyId, b.balance]),
	)
	for (const { currencyId, amountCents } of payments) {
		if ((balanceByCurrency.get(currencyId) ?? 0) < amountCents) {
			return await redirectWithToast('..', request, {
				type: 'error',
				title: t('statement.payment.action.insufficientBalance'),
			})
		}
	}

	await payStatement({
		db,
		statementId,
		date,
		fromAccountId: fromAccount.id,
		toAccountId: creditCard.accountId,
		payments: payments.map(p => ({
			currencyId: p.currencyId,
			amount: p.amountCents,
		})),
	})

	return await redirectWithToast(`..`, request, {
		type: 'success',
		title: t('statement.payment.action.paySuccessToast'),
	})
}

export default function PayStatement({
	loaderData: { accounts, owed },
	actionData,
}: Route.ComponentProps) {
	const { t, i18n } = useTranslation('credit-cards')
	const navigate = useNavigate()
	const navigation = useNavigation()

	const isSubmitting = navigation.state === 'submitting'
	const onClose = () => navigate('..')

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		defaultValue: {
			date: initializeDate().toISOString(),
			fromAccountId: accounts[0].id,
		},
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: payStatementFormSchema(t),
			})
		},
	})

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('statement.payment.payTitle')}</DialogTitle>
					<DialogDescription>
						{t('statement.payment.payDescription')}
					</DialogDescription>
				</DialogHeader>
				<Form method='post' {...getFormProps(form)}>
					<div className='flex flex-col gap-4'>
						<div className='flex flex-col gap-1 rounded-lg border bg-muted/30 p-3'>
							{owed.map(
								({ currencyId, currencyCode, amount }) => (
									<Text
										key={currencyId}
										size='sm'
										weight='medium'
										className='flex items-center gap-2'
									>
										<CurrencyIcon
											currency={currencyCode as TCurrency}
											size='sm'
										/>
										{getCurrencySymbol(
											currencyCode as TCurrency,
										)}{' '}
										{formatNumber(amount, i18n.language)}
									</Text>
								),
							)}
						</div>
						<div className='flex flex-col gap-2'>
							<DateField
								field={fields.date}
								label={t('statement.payment.dateLabel')}
							/>
							<SelectField
								field={fields.fromAccountId}
								label={t('statement.payment.fromAccountLabel')}
								placeholder={t(
									'statement.payment.fromAccountPlaceholder',
								)}
								items={accounts.map(a => ({
									label: a.name,
									value: a.id,
								}))}
							/>
						</div>
					</div>
					<DialogFooter className='mt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
						>
							{t('statement.payment.cancelButton')}
						</Button>
						<Button type='submit' loading={isSubmitting}>
							{t('statement.payment.submitButton')}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
