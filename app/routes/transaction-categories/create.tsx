import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm } from '@conform-to/react'
import { data, Link, Form, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { eq, and } from 'drizzle-orm'
import { useTranslation } from 'react-i18next'
import { safeRedirect } from 'remix-utils/safe-redirect'
import type { Route } from './+types/create'

import { transactionCategory as transactionCategoryTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
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

import { createTransactionCategoryFormSchema } from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const t = getServerT(context, 'transaction-categories')
	const url = new URL(request.url)
	const redirectTo = url.searchParams.get('redirectTo') || ''

	return {
		redirectTo,
		meta: {
			title: t('form.create.meta.title'),
			description: t('form.create.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transaction-categories')

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: createTransactionCategoryFormSchema(t).superRefine(
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
						message: t('form.create.action.duplicateError'),
					})
				}
			},
		),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { redirectTo, name, description } = submission.value
	await db.insert(transactionCategoryTable).values({
		name,
		description,
		ownerId: user.id,
	})

	return await redirectWithToast(
		safeRedirect(redirectTo || '/app/transaction-categories'),
		request,
		{
			type: 'success',
			title: t('form.create.action.successToast'),
		},
	)
}

export default function CreateTransactionCategory({
	loaderData: { redirectTo },
	actionData,
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['transaction-categories', 'components'])

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const schema = createTransactionCategoryFormSchema(t)

	const [form, fields] = useForm({
		lastResult: actionData?.submission,
		id: 'create-transaction-category-form',
		shouldValidate: 'onBlur',
		defaultValue: {
			name: '',
			description: '',
		},
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema,
			})
		},
	})

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to='..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>{t('form.create.title')}</CardTitle>
				</div>
				<CardDescription>{t('form.description')}</CardDescription>
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

					<input type='hidden' name='redirectTo' value={redirectTo} />

					<TextField
						autoFocus
						label={t('form.nameLabel')}
						field={fields.name}
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
					form={form.id}
					type='submit'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{t('form.create.submitButton')}
				</Button>
			</CardFooter>
		</Card>
	)
}
