import {
	getFormProps,
	getInputProps,
	getSelectProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Form, Link } from 'react-router'
import { z } from 'zod'

import type { Route } from './+types/create'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { ErrorList, Field, SelectField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'

export function meta() {
	return [
		{ title: 'Create Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Create Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Create accounts to track your expenses',
		},
	]
}

// export const accountFormSchema = v.object({
// 	name: v.pipe(v.string(), v.nonEmpty(t('name-required-msg')), v.trim()),
// 	accountType: v.picklist(ACCOUNT_TYPES, t('account-type-required-msg')),
// 	description: v.pipe(v.string(), v.trim()),
// 	subAccounts: v.pipe(
// 		v.array(subAccountFormSchema),
// 		v.minLength(1, t('sub-accounts-required-msg')),
// 		v.check(input => {
// 			const currencies = input.map(item => item.currencyId)
// 			const setLength = [...new Set(currencies)].length
// 			return input.length === setLength
// 		}, t('currency-repeated-msg')),
// 	),
// })

export const ACCOUNT_TYPES = [
	'cash',
	'bank',
	'digital-wallet',
	'crypto-wallet',
	'crypto-exchange',
	'broker',
] as const

const AccountFormSchema = z.object({
	name: z.string('name-required-msg').transform(value => value.trim()),
	accountType: z.enum(ACCOUNT_TYPES, 'account-type-required-msg'),
	description: z
		.string()
		.optional()
		.transform(value => value?.trim()),
})

export default function CreateAccount({ actionData }: Route.ComponentProps) {
	const [form, fields] = useForm({
		id: 'create-account-form',
		constraint: getZodConstraint(AccountFormSchema),
		// lastResult: actionData?.submission,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AccountFormSchema })
		},
	})

	return (
		<>
			<Button asChild variant='link'>
				<Link to='..' relative='path'>
					<ArrowLeftIcon />
					Back
				</Link>
			</Button>
			<Card className='mx-auto md:max-w-2xl'>
				<CardHeader>
					<CardTitle>Create an account</CardTitle>
					<CardDescription>
						Accounts hold your balance and are used to create
						transactions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form method='post' {...getFormProps(form)}>
						<Field
							labelProps={{ children: 'name-input-label' }}
							inputProps={{
								...getInputProps(fields.name, { type: 'text' }),
								autoFocus: true,
							}}
							errors={fields.name.errors}
						/>

						<Field
							labelProps={{ children: 'description-input-label' }}
							inputProps={{
								...getInputProps(fields.description, {
									type: 'text',
								}),
								autoFocus: true,
							}}
							errors={fields.description.errors}
						/>

						<SelectField
							labelProps={{
								children: 'account-type-input-label',
							}}
							selectProps={{
								...getSelectProps(fields.accountType),
								defaultValue: '',
								placeholder: 'account-type-placeholder',
								items: ACCOUNT_TYPES.map(i => ({
									value: i,
									label: `${i}-label`,
								})),
							}}
						/>

						<ErrorList errors={form.errors} id={form.errorId} />
					</Form>
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</>
	)
}
