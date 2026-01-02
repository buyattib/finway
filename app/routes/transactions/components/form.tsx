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
import type { Route } from '../+types/edit'

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
	TextField,
	SelectField,
	ComboboxField,
	NumberField,
	DateField,
} from '~/components/forms'
import { TransactionTypeIcon } from '~/components/transaction-type-icon'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { ACTION_CREATION, ACTION_EDITION } from '../lib/constants'
import { TransactionFormSchema } from '../lib/schemas'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_DISPLAY,
} from '../lib/constants'

type LoaderData = Route.ComponentProps['loaderData']

type Props = Pick<
	LoaderData,
	'accounts' | 'currencies' | 'transactionCategories'
> & {
	lastResult?: SubmissionResult
} & (
		| {
				action: typeof ACTION_CREATION
		  }
		| {
				action: typeof ACTION_EDITION
				transaction: LoaderData['transaction']
		  }
	)

export function TransactionForm(props: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { accounts, currencies, transactionCategories } = props

	const defaultValue = () => {
		if (props.action === ACTION_CREATION) {
			return {
				date: initializeDate().toISOString(),
				type: TRANSACTION_TYPE_EXPENSE,
				amount: '0',
				description: '',
				accountId: accounts?.[0]?.id || '',
				currencyId: currencies?.[0]?.id || '',
				transactionCategoryId: transactionCategories?.[0]?.id || '',
			}
		}

		if (props.action === ACTION_EDITION) {
			const tx = props.transaction
			return {
				date: tx.date,
				type: tx.type,
				amount: tx.amount,
				description: tx.description,
				accountId: tx.accountId,
				currencyId: tx.currencyId,
				transactionCategoryId: tx.transactionCategoryId,
			}
		}

		throw new Error('Invalid action')
	}

	const [form, fields] = useForm({
		lastResult: props.lastResult,
		id: 'transaction-form',
		shouldValidate: 'onInput',
		defaultValue: defaultValue(),
		constraint: getZodConstraint(TransactionFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: TransactionFormSchema,
			})
		},
	})

	const { title, buttonLabel } = {
		[ACTION_CREATION]: {
			title: 'Create a transaction',
			buttonLabel: 'Create',
		},
		[ACTION_EDITION]: {
			title: 'Edit transaction',
			buttonLabel: 'Update',
		},
	}[props.action]

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
						<Link to='..' relative='path'>
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

					<input type='hidden' name='action' value={props.action} />

					{props.action === ACTION_EDITION && (
						<input
							type='hidden'
							name='id'
							value={props.transaction.id}
						/>
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
								items={accountOptions}
							/>

							<ComboboxField
								label='Currency'
								field={fields.currencyId}
								buttonPlaceholder='Select a currency'
								items={currencyOptions}
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

					<NumberField label='Amount' field={fields.amount} />

					{transactionCategories.length !== 0 ? (
						<ComboboxField
							label='Transaction Category'
							field={fields.transactionCategoryId}
							buttonPlaceholder='Select a transaction category'
							items={transactionCategoryOptions}
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
