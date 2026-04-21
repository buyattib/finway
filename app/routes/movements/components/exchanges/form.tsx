import {
	Link,
	Form,
	useNavigation,
	createSearchParams,
	useLocation,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from '../../+types'

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

type Props = {
	lastResult?: SubmissionResult
} & Route.ComponentProps['loaderData']['formData'] &
	(
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				exchange: { id: string }
		  }
	)

export function ExchangeForm({
	selectData,
	balances,
	lastResult,
	...props
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t, i18n } = useTranslation('exchanges')

	const { accounts, currencies } = selectData

	const { defaultValue, buttonLabel, formAction } = {
		[ACTION_CREATION]: {
			defaultValue: {
				date: initializeDate().toISOString(),
				fromAmount: '0',
				toAmount: '0',
				fromCurrencyId: '',
				toCurrencyId: '',
				accountId: '',
			},
			buttonLabel: t('form.create.submitButton'),
			formAction: '/app/exchanges/create',
		},
		[ACTION_EDITION]: {
			defaultValue: {},
			buttonLabel: '', // t('form.edit.submitButton'),
			formAction: location.pathname,
		},
	}[props.action]

	const isSubmitting =
		navigation.formAction === formAction &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult,
		id: 'exchange-form',
		shouldValidate: 'onBlur',
		defaultValue,
		constraint: getZodConstraint(createExchangeFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createExchangeFormSchema(t),
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
		? t('form.availableBalance', {
				symbol: getCurrencySymbol(selectedBalance.currency),
				amount: formatNumber(selectedBalance.balance, i18n.language),
				currency: selectedBalance.currency,
			})
		: undefined

	return (
		<>
			<Form
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

				<DateField label={t('form.dateLabel')} field={fields.date} />

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

			<div className='flex gap-2'>
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
					{buttonLabel}
				</Button>
			</div>
		</>
	)
}
