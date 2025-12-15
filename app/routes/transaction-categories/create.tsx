import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { data, redirect, Link, Form, useNavigation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from '~/components/ui/card'
import { ErrorList, TextField } from '~/components/forms'

import { TransactionCategoryFormSchema } from './lib/schemas'
import { getExistingCategoriesCount, createUserCategory } from './lib/queries'

export function meta() {
	return [
		{ title: 'Create Categories | Finhub' },

		{
			property: 'og:title',
			content: 'Create Categories | Finhub',
		},
		{
			name: 'description',
			content: 'Create categories to assign to your transactions',
		},
	]
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: TransactionCategoryFormSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	const existingCategories = await getExistingCategoriesCount(db, {
		userId: user.id,
		name: body.name,
	})
	if (existingCategories > 0) {
		return data(
			{
				submission: submission.reply({
					formErrors: ['A category with this name already exists'],
				}),
			},
			{ status: 422 },
		)
	}

	await createUserCategory(db, user.id, body)

	return redirect(`/app/transaction-categories`)
}

export default function CreateTransactionCategory({
	actionData,
}: Route.ComponentProps) {
	const navigation = useNavigation()
	const isSubmitting =
		(navigation.formAction === '/app/accounts/create' ||
			navigation.formAction === '/app/accounts/edit') &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transaction-category-form',
		constraint: getZodConstraint(TransactionCategoryFormSchema),
		shouldValidate: 'onInput',
		defaultValue: {
			name: '',
			description: '',
		},
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: TransactionCategoryFormSchema,
			})
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
			<div className='flex justify-center'>
				<Card className='md:max-w-2xl w-full'>
					<CardHeader>
						<CardTitle>Create a category</CardTitle>
						<CardDescription>
							Transaction categories are used to classify your
							transactions
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form
							{...getFormProps(form)}
							method='post'
							className='flex flex-col gap-1'
						>
							<ErrorList
								size='md'
								errors={form.errors}
								id={form.errorId}
							/>

							<TextField
								autoFocus
								label='Name'
								field={fields.name}
							/>
							<TextField
								label='Description'
								field={fields.description}
							/>
						</Form>
					</CardContent>
					<CardFooter className='gap-2'>
						<Button
							width='full'
							form={form.id}
							type='submit'
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							Create
						</Button>
					</CardFooter>
				</Card>
			</div>
		</>
	)
}
