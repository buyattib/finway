import { Link, useFetcher, createSearchParams, useLocation } from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from '../../+types'
import type { Route as EditRoute } from '../../+types/edit'

import { initializeDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import {
	ErrorList,
	ComboboxField,
	AmountField,
	DateField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { createExchangeFormSchema } from '~/routes/exchanges/lib/schemas'

type ExchangeEditData = Extract<
	EditRoute.ComponentProps['loaderData'],
	{ exchange: unknown }
>['exchange']

type Props = Route.ComponentProps['loaderData']['formData'] &
	(
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				exchange: ExchangeEditData
		  }
	)

export function ExchangeForm({ selectData, balances, ...props }: Props) {
	const fetcher = useFetcher<{ submission?: SubmissionResult }>()
	const { t, i18n } = useTranslation('movements')
	const { t: tSchema } = useTranslation('exchanges')
	const location = useLocation()

	const { accounts, currencies } = selectData

	const { defaultValue, buttonLabel, formAction } =
		props.action === ACTION_CREATION
			? {
					defaultValue: {
						date: initializeDate().toISOString(),
						fromAmount: '0',
						toAmount: '0',
						fromCurrencyId: '',
						toCurrencyId: '',
						accountId: '',
					},
					buttonLabel: t('form.common.createSubmitButton'),
					formAction: `/app/movements/exchanges/create${location.search}`,
				}
			: {
					defaultValue: {
						date: props.exchange.date,
						fromAmount: props.exchange.fromAmount,
						toAmount: props.exchange.toAmount,
						fromCurrencyId: props.exchange.fromCurrencyId,
						toCurrencyId: props.exchange.toCurrencyId,
						accountId: props.exchange.accountId,
					},
					buttonLabel: t('form.common.editSubmitButton'),
					formAction: `/app/movements/exchanges/${props.exchange.id}/edit${location.search}`,
				}

	const isSubmitting = fetcher.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: fetcher.data?.submission,
		id: 'exchange-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(createExchangeFormSchema(tSchema)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createExchangeFormSchema(tSchema),
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

	const selectedBalance = balances.find(
		b =>
			b.accountId === fields.accountId.value &&
			b.currencyId === fields.fromCurrencyId.value,
	)

	const balanceDescription = selectedBalance
		? t('form.common.availableBalance', {
				symbol: getCurrencySymbol(selectedBalance.currency),
				amount: formatNumber(selectedBalance.balance, i18n.language),
				currency: selectedBalance.currency,
			})
		: undefined

	return (
		<>
			<fetcher.Form
				{...getFormProps(form)}
				method='post'
				action={formAction}
				className='flex flex-col gap-1'
			>
				{/* Have first button to be submit */}
				<button type='submit' className='hidden' />

				<input type='hidden' name='action' value={props.action} />

				{props.action === ACTION_EDITION && (
					<input type='hidden' name='id' value={props.exchange.id} />
				)}

				<ErrorList size='md' errors={form.errors} id={form.errorId} />

				<DateField
					label={t('form.exchange.dateLabel')}
					field={fields.date}
				/>

				{accounts.length !== 0 ? (
					<>
						<ComboboxField
							label={t('form.exchange.accountLabel')}
							field={fields.accountId}
							buttonPlaceholder={t(
								'form.exchange.accountPlaceholder',
							)}
							options={accountOptions}
						/>

						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label={t('form.exchange.fromCurrencyLabel')}
								field={fields.fromCurrencyId}
								buttonPlaceholder={t(
									'form.exchange.currencyPlaceholder',
								)}
								options={currencyOptions}
							/>

							<ComboboxField
								label={t('form.exchange.toCurrencyLabel')}
								field={fields.toCurrencyId}
								buttonPlaceholder={t(
									'form.exchange.currencyPlaceholder',
								)}
								options={currencyOptions}
							/>
						</div>

						<AmountField
							label={t('form.exchange.fromAmountLabel')}
							field={fields.fromAmount}
							description={balanceDescription}
							maxValue={selectedBalance?.balance}
						/>

						<AmountField
							label={t('form.exchange.toAmountLabel')}
							field={fields.toAmount}
						/>
					</>
				) : (
					<Text size='sm' theme='muted' alignment='center'>
						<Trans
							i18nKey='form.common.noAccountMessage'
							ns='movements'
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
			</fetcher.Form>

			<div className='flex gap-2'>
				<Button
					width='full'
					variant='outline'
					{...form.reset.getButtonProps()}
				>
					{t('form.common.resetButton')}
				</Button>
				<Button
					width='full'
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{buttonLabel}
				</Button>
			</div>
		</>
	)
}
