import { Link, Form, useNavigation, data } from 'react-router'
import { PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useTranslation } from 'react-i18next'
import type { Route } from './+types'

import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'

import { Spinner } from '~/components/ui/spinner'
import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { EmptyState } from '~/components/empty-state'

import {
	AddSuggestionsSchema,
	DeleteTransactionCategoryFormSchema,
} from './lib/schemas'
import {
	getTransactionCategories,
	getTransactionCategoryById,
	deleteTransactionCategory,
	getExistingCategoriesByName,
	bulkCreateTransactionCategories,
} from './lib/queries'
import { SuggestedCategoriesDialog } from './components/suggested-categories-dialog'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'transaction-categories')

	const transactionCategories = await getTransactionCategories({
		db,
		ownerId: user.id,
	})

	return {
		transactionCategories,
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transaction-categories')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'add-suggestions') {
		const parsed = AddSuggestionsSchema.safeParse({
			intent,
			categoryNames: formData.getAll('categoryNames'),
		})

		if (!parsed.success) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.suggestions.noneSelectedError'),
			})
			return data({}, { headers: toastHeaders })
		}

		const { categoryNames } = parsed.data

		const existingCategories = await getExistingCategoriesByName({
			db,
			ownerId: user.id,
			categoryNames,
		})

		const existingNames = new Set(
			existingCategories.map(c => c.name.toLowerCase()),
		)
		const newCategories = categoryNames.filter(
			name => !existingNames.has(name.toLowerCase()),
		)

		if (newCategories.length > 0) {
			await bulkCreateTransactionCategories({
				db,
				ownerId: user.id,
				names: newCategories,
			})
		}

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: t('index.suggestions.successToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	const submission = parseWithZod(formData, {
		schema: DeleteTransactionCategoryFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.deleteErrorToast'),
			description: t('index.action.deleteErrorToastDescription'),
		})
		return data({}, { headers: toastHeaders })
	}

	const { transactionCategoryId } = submission.value

	const transactionCategory = await getTransactionCategoryById({
		db,
		transactionCategoryId,
	})
	if (!transactionCategory || transactionCategory.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.notFoundError', { transactionCategoryId }),
		})
		return data({}, { headers: toastHeaders })
	}

	await deleteTransactionCategory({ db, transactionCategoryId })

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}

export default function TransactionCategories({
	loaderData: { transactionCategories },
}: Route.ComponentProps) {
	const navigation = useNavigation()
	const { t } = useTranslation('transaction-categories')

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/transaction-categories?index` &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transactionCategoryId')

	return (
		<PageSection id='transaction-categories-section'>
			<PageHeader>
				<Title id='transaction-categories-section' level='h3'>
					{t('index.title')}
				</Title>
				<div className='flex items-center gap-2'>
					<SuggestedCategoriesDialog
						existingCategoryNames={transactionCategories.map(
							c => c.name,
						)}
					/>
					<Button asChild variant='default' autoFocus>
						<Link to='create'>
							<PlusIcon aria-hidden />
							<span className='sm:inline hidden'>
								{t('index.addCategoryLabel')}
							</span>
						</Link>
					</Button>
				</div>
			</PageHeader>

			<PageContent>
				{transactionCategories.length === 0 && (
					<EmptyState
						icon={TagIcon}
						title={t('index.emptyTitle')}
						action={
							<Button asChild>
								<Link to='create'>
									<PlusIcon />
									{t('index.addCategoryLabel')}
								</Link>
							</Button>
						}
					/>
				)}

				<ul className='flex flex-col gap-2'>
					{transactionCategories.map(({ id, name, description }) => (
						<li
							key={id}
							className='flex items-center justify-between px-4 md:px-6 py-3 border rounded-md'
						>
							<div className='flex items-center gap-3'>
								<TagIcon className='size-4 text-muted-foreground shrink-0' />
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
												<Spinner
													aria-hidden
													size='sm'
												/>
											) : (
												<TrashIcon aria-hidden />
											)}
											<span className='sr-only'>
												{t('index.deleteAriaLabel', {
													name,
												})}
											</span>
										</Button>
									</TooltipTrigger>
								</Form>
								<TooltipContent>
									{t('index.deleteTooltip')}
								</TooltipContent>
							</Tooltip>
						</li>
					))}
				</ul>
			</PageContent>
		</PageSection>
	)
}
