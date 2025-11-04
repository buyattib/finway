import {
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
	type SubmissionResult,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { PlusIcon, XIcon } from 'lucide-react'
import { Form, useNavigation } from 'react-router'

import type { Route } from '../+types/edit'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import {
	ErrorList,
	TextField,
	SelectField,
	NumberField,
} from '~/components/forms'

import { AccountFormSchema } from '../lib/schemas'
import { ACCOUNT_TYPES, CURRENCIES } from '../lib/constants'

export function AccountForm({
	account,
	lastResult,
}: {
	account?: Route.ComponentProps['loaderData']['account']
	lastResult: SubmissionResult | undefined
}) {
	const navigation = useNavigation()
	const isSubmitting =
		(navigation.formAction === '/app/accounts/create' ||
			navigation.formAction === '/app/accounts/edit') &&
		navigation.state === 'submitting'

	const isEditing = Boolean(account)

	const [form, fields] = useForm({
		lastResult,
		id: 'create-account-form',
		constraint: getZodConstraint(AccountFormSchema),
		shouldValidate: 'onInput',
		defaultValue: account ?? {
			name: '',
			accountType: '',
			description: '',
			subAccounts: [
				{
					currency: '',
					balance: '0',
				},
			],
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AccountFormSchema })
		},
	})

	const subAccounts = fields.subAccounts.getFieldList()

	return (
		<Card className='md:max-w-2xl w-full'>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>
					Accounts hold your balance and are used to create
					transactions
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form
					method='post'
					{...getFormProps(form)}
					className='flex flex-col gap-2'
				>
					{/* Have first button to be submit */}
					<button type='submit' className='hidden' />

					{/* Add the account id to the form if there is one  */}
					{account && (
						<input type='hidden' name='id' value={account.id} />
					)}

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>
					<TextField
						autoFocus
						label={'name-input-label'}
						field={fields.name}
					/>
					<TextField
						label={'description-input-label'}
						field={fields.description}
					/>
					<SelectField
						label={'account-type-input-label'}
						field={fields.accountType}
						placeholder={'account-type-placeholder'}
						items={ACCOUNT_TYPES.map(i => ({
							value: i,
							label: `${i}-label`,
						}))}
					/>
					<fieldset
						className='flex flex-col gap-4'
						{...getFieldsetProps(fields.subAccounts)}
					>
						<div className='flex items-start justify-between'>
							<Title level='h4'>Supported Currencies</Title>
							<Button
								variant='outline'
								disabled={
									subAccounts.length === CURRENCIES.length
								}
								{...form.insert.getButtonProps({
									name: fields.subAccounts.name,
									defaultValue: {
										currency: '',
										balance: '0',
									},
								})}
							>
								<span aria-hidden>
									<PlusIcon />
								</span>
								<span className='sr-only'>Add Currency</span>
							</Button>
						</div>
						<ErrorList
							size='md'
							id={fields.subAccounts.errorId}
							errors={fields.subAccounts.errors}
						/>
						<ul className='flex flex-col gap-2'>
							{subAccounts.map((subAccount, index) => {
								const { currency, balance, id } =
									subAccount.getFieldset()

								return (
									<li
										key={subAccount.key}
										className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 pt-6 border rounded-xl relative'
									>
										{isEditing && (
											<input
												{...getInputProps(id, {
													type: 'hidden',
												})}
											/>
										)}

										<SelectField
											label={'currency-input-label'}
											field={currency}
											placeholder={'currency-placeholder'}
											disabled={isEditing && !!id.value}
											items={CURRENCIES.map(i => ({
												value: i,
												label: `${i}-label`,
											}))}
										/>

										{/* Disabled inputs are not included in forms, add hidden one for edition */}
										{isEditing && id.value && (
											<input
												{...getInputProps(balance, {
													type: 'hidden',
												})}
											/>
										)}
										<NumberField
											label={'balance-input-label'}
											placeholder={
												'balance-input-placeholder'
											}
											field={balance}
											disabled={isEditing && !!id.value}
										/>

										<div className='absolute right-2 top-2'>
											<Button
												variant='destructive-outline'
												size='icon-sm'
												disabled={
													subAccounts.length === 1
												}
												{...form.remove.getButtonProps({
													name: fields.subAccounts
														.name,
													index,
												})}
											>
												<span aria-hidden>
													<XIcon />
												</span>
												<span className='sr-only'>
													Remove currency{' '}
													{`${currency.value}-label`}
												</span>
											</Button>
										</div>
									</li>
								)
							})}
						</ul>
					</fieldset>
				</Form>
			</CardContent>
			<CardFooter className='gap-2'>
				{!isEditing && (
					<Button
						width='full'
						variant='outline'
						{...form.reset.getButtonProps()}
					>
						Reset
					</Button>
				)}
				<Button
					width='full'
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{isEditing ? 'Update' : 'Create'}
				</Button>
			</CardFooter>
		</Card>
	)
}
