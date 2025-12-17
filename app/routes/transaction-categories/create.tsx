import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { data, Link, Form, useNavigation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { eq, and } from 'drizzle-orm'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { transactionCategory as transactionCategoryTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'

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

import { CreateTransactionCategoryFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Create Transaction Categories | Finhub' },

		{
			property: 'og:title',
			content: 'Create TransactionCategories | Finhub',
		},
		{
			name: 'description',
			content:
				'Create transaction categories to assign to your transactions',
		},
	]
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreateTransactionCategoryFormSchema.superRefine(
			async (data, ctx) => {
				const existingTransactionCategoriesCount = await db.$count(
					transactionCategoryTable,
					and(
						eq(transactionCategoryTable.ownerId, user.id),
						eq(transactionCategoryTable.name, data.name),
					),
				)

				if (existingTransactionCategoriesCount > 0) {
					return ctx.addIssue({
						code: 'custom',
						message:
							'A transaction category with this name already exists',
					})
				}
			},
		),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	await db.insert(transactionCategoryTable).values({
		name: body.name,
		description: body.description,
		ownerId: user.id,
	})

	return await redirectWithToast('/app/transaction-categories', request, {
		type: 'success',
		title: 'Transaction category created',
	})
}

export default function CreateTransactionCategory({
	actionData,
}: Route.ComponentProps) {
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === '/app/transaction-categories/create' &&
		navigation.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transaction-category-form',
		shouldValidate: 'onInput',
		defaultValue: {
			name: '',
			description: '',
		},
		constraint: getZodConstraint(CreateTransactionCategoryFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: CreateTransactionCategoryFormSchema,
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
						<CardTitle>Create a transaction category</CardTitle>
						<CardDescription>
							Transaction categories are used to classify your
							expenses and incomes
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
