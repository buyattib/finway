import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Link, Form, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'

import type { Route as EditRoute } from '../+types/edit'

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

import type { getSelectData } from '~/routes/transactions/lib/queries'

import { CreditCardFormSchema } from '../lib/schemas'
import { ACTION_CREATION, ACTION_EDITION } from '../lib/constants'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props = {
	selectData: Pick<
		Awaited<ReturnType<typeof getSelectData>>,
		'accounts' | 'currencies'
	>
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
	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { accounts, currencies } = selectData
	const isEditing = action === ACTION_EDITION

	const { title, buttonLabel } = {
		[ACTION_CREATION]: {
			title: 'Create a credit card',
			buttonLabel: 'Create',
		},
		[ACTION_EDITION]: {
			title: 'Edit credit card',
			buttonLabel: 'Update',
		},
	}[action]

	const [form, fields] = useForm({
		lastResult,
		id: 'credit-card-form',
		shouldValidate: 'onInput',
		defaultValue: initialData,
		constraint: getZodConstraint(CreditCardFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreditCardFormSchema,
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
						<Link to='/app/credit-cards' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>{title}</CardTitle>
				</div>
				<CardDescription>
					Add a credit card to track expenses associated with it.
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

					<TextField
						autoFocus
						label='Brand'
						field={fields.brand}
						placeholder='Visa, Mastercard, etc.'
					/>

					<NumberField
						label='Last 4 digits'
						field={fields.last4}
						maxLength={4}
						placeholder='1234'
					/>

					<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
						<NumberField
							label='Expiry Month'
							field={fields.expiryMonth}
							placeholder='MM'
							maxLength={2}
						/>
						<NumberField
							label='Expiry Year'
							field={fields.expiryYear}
							placeholder='YYYY'
							maxLength={4}
						/>
					</div>

					{accounts.length !== 0 ? (
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<ComboboxField
								label='Account'
								field={fields.accountId}
								buttonPlaceholder='Select an account'
								options={accountOptions}
								disabled={isEditing}
							/>

							<ComboboxField
								label='Currency'
								field={fields.currencyId}
								buttonPlaceholder='Select a currency'
								options={currencyOptions}
								disabled={isEditing}
							/>
						</div>
					) : (
						<Text size='sm' theme='muted' alignment='center'>
							You need to create an account first. Do it{' '}
							<Link
								to='/app/accounts/create'
								className='text-primary'
							>
								here
							</Link>
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
