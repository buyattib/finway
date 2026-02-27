import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Link, Form, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route as EditRoute } from '../+types/edit'

import type { TSelectData } from '~/lib/types'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

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
	TextField,
	NumberField,
	ComboboxField,
} from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { createCreditCardFormSchema } from '../lib/schemas'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props = {
	selectData: Pick<TSelectData, 'accounts' | 'currencies'>
	lastResult?: SubmissionResult
	initialData: Partial<TInitialData>
	action: typeof ACTION_CREATION | typeof ACTION_EDITION
}

export function CreditCardForm({
	selectData,
	lastResult,
	initialData,
	action,
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation('credit-cards')

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { accounts, currencies } = selectData
	const isEditing = action === ACTION_EDITION

	const { title, buttonLabel } = {
		[ACTION_CREATION]: {
			title: t('form.create.title'),
			buttonLabel: t('form.create.submitButton'),
		},
		[ACTION_EDITION]: {
			title: t('form.edit.title'),
			buttonLabel: t('form.edit.submitButton'),
		},
	}[action]

	const [form, fields] = useForm({
		lastResult,
		id: 'credit-card-form',
		shouldValidate: 'onInput',
		defaultValue: initialData,
		constraint: getZodConstraint(createCreditCardFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createCreditCardFormSchema(t),
			})
		},
	})

	const accountOptions = accounts.map(({ id, name, accountType }) => ({
		icon: <AccountTypeIcon accountType={accountType} size='xs' />,
		value: id,
		label: name,
	}))

	const currencyOptions = currencies.map(({ id, code }) => ({
		icon: <CurrencyIcon currency={code} size='sm' />,
		value: id,
		label: code,
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
					<CardTitle>{title}</CardTitle>
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

					<input type='hidden' name='action' value={action} />

					{action === ACTION_EDITION && (
						<input type='hidden' name='id' value={initialData.id} />
					)}

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>

					<TextField
						autoFocus
						label={t('form.brandLabel')}
						field={fields.brand}
						placeholder={t('form.brandPlaceholder')}
					/>

					<NumberField
						label={t('form.last4Label')}
						field={fields.last4}
						maxLength={4}
						placeholder={t('form.last4Placeholder')}
					/>

					<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
						<NumberField
							label={t('form.expiryMonthLabel')}
							field={fields.expiryMonth}
							placeholder={t('form.expiryMonthPlaceholder')}
							maxLength={2}
						/>
						<NumberField
							label={t('form.expiryYearLabel')}
							field={fields.expiryYear}
							placeholder={t('form.expiryYearPlaceholder')}
							maxLength={4}
						/>
					</div>

					{accounts.length !== 0 ? (
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label={t('form.accountLabel')}
								field={fields.accountId}
								buttonPlaceholder={t('form.accountPlaceholder')}
								options={accountOptions}
								disabled={isEditing}
							/>

							<ComboboxField
								label={t('form.currencyLabel')}
								field={fields.currencyId}
								buttonPlaceholder={t(
									'form.currencyPlaceholder',
								)}
								options={currencyOptions}
								disabled={isEditing}
							/>
						</div>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							<Trans
								i18nKey='form.noAccountMessage'
								ns='credit-cards'
								components={[
									<Link
										key='0'
										to='/app/accounts/create'
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
					{buttonLabel}
				</Button>
			</CardFooter>
		</Card>
	)
}
