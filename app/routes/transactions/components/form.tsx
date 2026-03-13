import {
	Link,
	Form,
	useNavigation,
	createSearchParams,
	useLocation,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { ArrowLeftIcon } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import type { Route as EditRoute } from '../+types/edit'

import { initializeDate } from '~/lib/utils'
import {
	ACTION_CREATION,
	ACTION_EDITION,
	TRANSACTION_TYPES,
} from '~/lib/constants'
import type { TSelectData } from '~/lib/types'

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
	SelectField,
	ComboboxField,
	AmountField,
	DateField,
} from '~/components/forms'
import { TransactionType } from '~/components/transaction-type'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { createTransactionFormSchema } from '../lib/schemas'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props = {
	selectData: TSelectData
	lastResult?: SubmissionResult
	initialData: Partial<TInitialData>
	action: typeof ACTION_CREATION | typeof ACTION_EDITION
}

export function TransactionForm({
	selectData,
	lastResult,
	initialData,
	action,
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['transactions', 'constants'])

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { accounts, currencies, transactionCategories } = selectData

	const TransactionFormSchema = createTransactionFormSchema(t)

	const { defaultValue, title, buttonLabel, to } = {
		[ACTION_CREATION]: {
			defaultValue: {
				date: initializeDate().toISOString(),
				...initialData,
			},
			title: t('form.create.title'),
			buttonLabel: t('form.create.submitButton'),
			to: '..',
		},
		[ACTION_EDITION]: {
			defaultValue: initialData,
			title: t('form.edit.title'),
			buttonLabel: t('form.edit.submitButton'),
			to: '../..',
		},
	}[action]

	const [form, fields] = useForm({
		lastResult,
		id: 'transaction-form',
		shouldValidate: 'onInput',
		defaultValue,
		constraint: getZodConstraint(TransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: TransactionFormSchema,
			})
		},
	})

	const transactionTypeOptions = TRANSACTION_TYPES.map(i => ({
		icon: <TransactionType variant='icon' size='sm' transactionType={i} />,
		value: i,
		label: t(`constants:transactionType.${i}`),
	}))

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

	const transactionCategoryOptions = transactionCategories.map(
		({ id, name }) => ({
			value: id,
			label: name,
		}),
	)

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to={to} relative='path'>
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

					<SelectField
						label={t('form.transactionTypeLabel')}
						field={fields.type}
						placeholder={t('form.transactionTypePlaceholder')}
						items={transactionTypeOptions}
					/>

					{accounts.length !== 0 ? (
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label={t('form.accountLabel')}
								field={fields.accountId}
								buttonPlaceholder={t('form.accountPlaceholder')}
								options={accountOptions}
							/>

							<ComboboxField
								label={t('form.currencyLabel')}
								field={fields.currencyId}
								buttonPlaceholder={t(
									'form.currencyPlaceholder',
								)}
								options={currencyOptions}
							/>
						</div>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							<Trans
								ns='transactions'
								i18nKey='form.noAccountMessage'
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

					<AmountField
						label={t('form.amountLabel')}
						field={fields.amount}
					/>

					{transactionCategories.length !== 0 ? (
						<ComboboxField
							label={t('form.categoryLabel')}
							field={fields.transactionCategoryId}
							buttonPlaceholder={t('form.categoryPlaceholder')}
							options={transactionCategoryOptions}
						/>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							<Trans
								ns='transactions'
								i18nKey='form.noCategoryMessage'
								components={[
									<Link
										key='0'
										to={{
											pathname:
												'/app/transaction-categories/create',
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

					<DateField
						label={t('form.dateLabel')}
						field={fields.date}
					/>

					<TextField
						label={t('form.descriptionLabel')}
						field={fields.description}
					/>
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
