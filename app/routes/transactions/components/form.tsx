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
import type { Route as EditRoute } from '../+types/edit'

import { initializeDate } from '~/lib/utils'

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
import { TransactionTypeIcon } from '~/components/transaction-type-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import {
	ACTION_CREATION,
	ACTION_EDITION,
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_DISPLAY,
} from '~/lib/constants'
import type { TSelectData } from '~/lib/types'

import { TransactionFormSchema } from '../lib/schemas'

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
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { accounts, currencies, transactionCategories } = selectData

	const { defaultValue, title, buttonLabel, to } = {
		[ACTION_CREATION]: {
			defaultValue: {
				date: initializeDate().toISOString(),
				...initialData,
			},
			title: 'Create a transaction',
			buttonLabel: 'Create',
			to: '..',
		},
		[ACTION_EDITION]: {
			defaultValue: initialData,
			title: 'Edit transaction',
			buttonLabel: 'Update',
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
		icon: <TransactionTypeIcon size='sm' transactionType={i} />,
		value: i,
		label: TRANSACTION_TYPE_DISPLAY[i].label,
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
				<CardDescription>
					Incomes and expenses will affect your account balances and
					are used to track your finances.
				</CardDescription>
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
						label='Transaction Type'
						field={fields.type}
						placeholder='Select an transaction type'
						items={transactionTypeOptions}
					/>

					{accounts.length !== 0 ? (
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label='Account'
								field={fields.accountId}
								buttonPlaceholder='Select an account'
								options={accountOptions}
							/>

							<ComboboxField
								label='Currency'
								field={fields.currencyId}
								buttonPlaceholder='Select a currency'
								options={currencyOptions}
							/>
						</div>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							You need to create an account first. Do it{' '}
							<Link
								to={{
									pathname: '/app/accounts/create',
									search: createSearchParams({
										redirectTo: location.pathname,
									}).toString(),
								}}
								className='text-primary'
							>
								here
							</Link>
						</Text>
					)}

					<AmountField label='Amount' field={fields.amount} />

					{transactionCategories.length !== 0 ? (
						<ComboboxField
							label='Transaction Category'
							field={fields.transactionCategoryId}
							buttonPlaceholder='Select a transaction category'
							options={transactionCategoryOptions}
						/>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							You need to create a transaction category first. Do
							it{' '}
							<Link
								to={{
									pathname:
										'/app/transaction-categories/create',
									search: createSearchParams({
										redirectTo: location.pathname,
									}).toString(),
								}}
								className='text-primary'
							>
								here
							</Link>
						</Text>
					)}

					<DateField label='Date' field={fields.date} />

					<TextField
						label='Description (Optional)'
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
					Reset
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
