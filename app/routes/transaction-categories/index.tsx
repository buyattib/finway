import { Link, Form, useNavigation, data } from 'react-router'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'

import type { Route } from './+types'

import { transactionCategory as transactionCategoryTable } from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { createToastHeaders } from '~/utils-server/toast.server'

import { Spinner } from '~/components/ui/spinner'
import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

import { DeleteTransactionCategoryFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Transaction categories | Finway' },

		{
			property: 'og:title',
			content: 'Transaction categories | Finway',
		},
		{
			name: 'description',
			content: 'Your Transaction categories',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const transactionCategories = await db.query.transactionCategory.findMany({
		orderBy: (transactionCategory, { desc }) => [
			desc(transactionCategory.createdAt),
		],
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.ownerId, user.id),
		columns: { id: true, name: true, description: true },
	})

	return { transactionCategories }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteTransactionCategoryFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete transaction category',
			description: 'Please try again',
		})
		return data({}, { headers: toastHeaders })
	}

	const { transactionCategoryId } = submission.value

	const transactionCategory = await db.query.transactionCategory.findFirst({
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.id, transactionCategoryId),
		columns: { id: true, ownerId: true },
	})
	if (!transactionCategory || transactionCategory.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Transaction category ${transactionCategoryId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	await db
		.delete(transactionCategoryTable)
		.where(eq(transactionCategoryTable.id, transactionCategoryId))

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Transaction category deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function TransactionCategories({
	loaderData: { transactionCategories },
}: Route.ComponentProps) {
	const navigation = useNavigation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/transaction-categories?index` &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transactionCategoryId')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='transaction-categories-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='transaction-categories-section' level='h3'>
					Transaction Categories
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Category</span>
					</Link>
				</Button>
			</div>

			{transactionCategories.length === 0 && (
				<div className='my-2'>
					<Text size='md' weight='medium' alignment='center'>
						You have not created any transaction category yet. Start
						creating them{' '}
						<Link to='create' className='text-primary'>
							here
						</Link>
					</Text>
				</div>
			)}

			<ul className='flex flex-col gap-2'>
				{transactionCategories.map(({ id, name, description }) => (
					<li
						key={id}
						className='flex items-center justify-between px-4 md:px-6 py-1 border rounded-md'
					>
						<div className='flex items-center gap-2'>
							<Text>{name}</Text>
							<Text size='sm' theme='muted'>
								{description}
							</Text>
						</div>

						<Tooltip>
							<Form method='post'>
								<input
									type='hidden'
									name='transactionCategoryId'
									value={id}
								/>
								<TooltipTrigger asChild>
									<Button
										size='icon'
										variant='destructive-ghost'
										type='submit'
										name='intent'
										value='delete'
										disabled={isDeleting}
									>
										{isDeleting && deletingId === id ? (
											<Spinner aria-hidden size='sm' />
										) : (
											<TrashIcon aria-hidden />
										)}
										<span className='sr-only'>
											Delete category {name}
										</span>
									</Button>
								</TooltipTrigger>
							</Form>
							<TooltipContent>
								Deleting a category cannot be undone and
								transactions associated with it will become
								uncategorized.
							</TooltipContent>
						</Tooltip>
					</li>
				))}
			</ul>
		</section>
	)
}
