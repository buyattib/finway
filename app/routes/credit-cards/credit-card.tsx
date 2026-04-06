import {
	Link,
	Form,
	data,
	useNavigation,
	useLocation,
	useNavigate,
} from 'react-router'
import { SquarePenIcon, TrashIcon, PlusIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from './+types/credit-card'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import type { TCurrency } from '~/lib/types'
import { formatDate, formatNumber } from '~/lib/utils'
import { getSelectData } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'

import {
	getCreditCardById,
	getCreditCardTransactions,
	deleteCreditCard,
} from './lib/queries'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { PageSection, PageHeader } from '~/components/ui/page'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TablePagination } from '~/components/table-pagination'

import { CreditCardTransactionFilters } from './components/filters'
import { DeleteCreditCardFormSchema } from './lib/schemas'
import type { TCCTransactionType } from './lib/types'
import { creditCardContext } from './lib/context'

export function meta({ loaderData }: Route.MetaArgs) {
	const title = loaderData?.meta.title
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({
	context,
	request,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const page = Number(searchParams.get('page') ?? '1')
	const type = (searchParams.get('type') as TCCTransactionType) ?? ''
	const categoryId = searchParams.get('categoryId') ?? ''

	const selectData = await getSelectData(db, user.id)

	const { transactions, total } = await getCreditCardTransactions({
		db,
		creditCardId,
		type,
		categoryId,
		page,
		pageSize: PAGE_SIZE,
	})

	return {
		creditCard,
		transactions: transactions.map(t => ({
			...t,
			amount: String(t.amount / 100),
		})),
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
		filters: { type, categoryId },
		selectData,
		meta: {
			title: t('details.meta.title', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete-card') {
		const submission = parseWithZod(formData, {
			schema: DeleteCreditCardFormSchema,
		})

		if (submission.status !== 'success') {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('details.action.deleteCardErrorToast'),
				description: t('details.action.deleteCardErrorDescription'),
			})
			return data({}, { headers: toastHeaders })
		}

		const { creditCardId } = submission.value
		const creditCard = await getCreditCardById({ db, creditCardId })
		if (!creditCard || creditCard.account.ownerId !== user.id) {
			throw new Response(t('details.action.notFoundError'), {
				status: 404,
			})
		}

		await deleteCreditCard({ db, creditCardId })

		return await redirectWithToast('/app/credit-cards', request, {
			type: 'success',
			title: t('details.action.deleteCardSuccessToast', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		})
	}

	const toastHeaders = await createToastHeaders(request, {
		type: 'error',
		title: t('details.action.unknownActionToast'),
	})
	return data({}, { headers: toastHeaders })
}

export default function CreditCardDetails({
	loaderData: { creditCard, transactions, pagination, filters, selectData },
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const navigate = useNavigate()
	const { t } = useTranslation('credit-cards')

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

	const isDeletingCard =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete-card'

	return (
		<>
			<div className='flex sm:items-center gap-2 sm:ml-auto'>
				<Button size='icon' variant='outline' asChild>
					<Link to='edit'>
						<SquarePenIcon />
						<span className='sr-only'>
							{t('details.editAriaLabel', {
								brand: creditCard.brand,
								last4: creditCard.last4,
							})}
						</span>
					</Link>
				</Button>
				<Tooltip>
					<Form method='post'>
						<input
							type='hidden'
							name='creditCardId'
							value={creditCard.id}
						/>
						<TooltipTrigger asChild>
							<Button
								size='icon'
								variant='destructive-outline'
								type='submit'
								name='intent'
								value='delete-card'
								disabled={isDeletingCard}
							>
								{isDeletingCard ? (
									<Spinner size='sm' />
								) : (
									<TrashIcon aria-hidden />
								)}
								<span className='sr-only'>
									{t('details.deleteAriaLabel', {
										brand: creditCard.brand,
										last4: creditCard.last4,
									})}
								</span>
							</Button>
						</TooltipTrigger>
					</Form>
					<TooltipContent>
						{t('details.deleteTooltip')}
					</TooltipContent>
				</Tooltip>
			</div>

			<PageSection id='cc-transactions-section'>
				<PageHeader>
					<Title id='cc-transactions-section' level='h3'>
						{t('details.transactionsTitle', {
							total: pagination.total,
						})}
					</Title>
					<Button asChild variant='default'>
						<Link to='transactions/create'>
							<PlusIcon aria-hidden />
							<span className='sm:inline hidden'>
								{t('details.addTransactionLabel')}
							</span>
						</Link>
					</Button>
				</PageHeader>

				<CreditCardTransactionFilters
					filters={filters}
					selectData={selectData}
				/>

				<div className='h-6'>
					{isLoading && <Spinner size='md' className='mx-auto' />}
				</div>

				{transactions.length === 0 ? (
					<Text size='md' weight='medium' alignment='center'>
						<Trans
							i18nKey='details.emptyMessage'
							ns='credit-cards'
							components={[
								<Link
									key='0'
									to='transactions/create'
									className='text-primary'
								/>,
							]}
						/>
					</Text>
				) : (
					<ul className='flex flex-col gap-2'>
						{transactions.map(
							({
								id: txId,
								date,
								type,
								amount,
								currencyCode,
								categoryName,
								installments,
							}) => {
								return (
									<li
										key={txId}
										className='rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer'
										onClick={() =>
											navigate(`transactions/${txId}`)
										}
									>
										<div className='grid grid-cols-3 sm:grid-cols-5 items-center gap-4'>
											<Text size='sm' theme='muted'>
												{formatDate(new Date(date))}
											</Text>
											<TransactionType
												variant='icon-text'
												size='xs'
												transactionType={type}
											/>
											<Text
												size='sm'
												weight='medium'
												className='flex items-center gap-2'
											>
												<CurrencyIcon
													currency={
														currencyCode as TCurrency
													}
													size='sm'
												/>
												<b>{currencyCode}</b>{' '}
												{formatNumber(amount)}
											</Text>
											<Text size='sm' theme='muted'>
												{categoryName}
											</Text>
											<Text size='xs' theme='muted'>
												{installments}{' '}
												{t(
													'details.table.installments',
												)}
											</Text>
										</div>
									</li>
								)
							},
						)}
					</ul>
				)}

				<TablePagination
					page={pagination.page}
					pages={pagination.pages}
				/>
			</PageSection>
		</>
	)
}
