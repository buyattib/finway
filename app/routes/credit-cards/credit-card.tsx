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
import { useTranslation } from 'react-i18next'

import type { Route } from './+types/credit-card'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import type { TCurrency } from '~/lib/types'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { PAGE_SIZE } from '~/lib/constants'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { PageSection, PageHeader } from '~/components/ui/page'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { CurrencyIcon } from '~/components/currency-icon'
import { TablePagination } from '~/components/table-pagination'

import { DeleteCreditCardFormSchema } from './lib/schemas'
import { creditCardContext } from './lib/context'
import {
	getCreditCardById,
	getCreditCardStatements,
	deleteCreditCard,
} from './lib/queries'

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
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const page = Number(searchParams.get('page') ?? '1')

	const { statements: _statements, total } = await getCreditCardStatements({
		db,
		creditCardId,
		maxClosingDate: creditCard.closingDate,
		page,
		pageSize: PAGE_SIZE,
	})

	const statements = _statements.map(s => {
		const totalsByCurrency = new Map<TCurrency, number>()
		for (const inst of s.installments) {
			const code = inst.creditCardTransaction.currency.code
			totalsByCurrency.set(
				code,
				(totalsByCurrency.get(code) ?? 0) + inst.amount,
			)
		}
		return {
			id: s.id,
			closingDate: s.closingDate,
			dueDate: s.dueDate,
			totals: Array.from(totalsByCurrency, ([currencyCode, amount]) => ({
				currencyCode,
				total: String(amount / 100),
			})),
		}
	})

	return {
		creditCard,
		statements,
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
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
	loaderData: { creditCard, statements, pagination },
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

			<PageSection id='cc-statements-section'>
				<PageHeader>
					<Title id='cc-statements-section' level='h3'>
						{t('details.statementsTitle', {
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

				<div className='h-6'>
					{isLoading && <Spinner size='md' className='mx-auto' />}
				</div>

				{statements.length === 0 ? (
					<Text size='md' weight='medium' alignment='center'>
						{t('details.emptyStatements')}
					</Text>
				) : (
					<ul className='flex flex-col gap-2'>
						{statements.map(
							({ id, closingDate, dueDate, totals }) => (
								<li
									key={id}
									className='rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer'
									onClick={() => navigate(`statements/${id}`)}
								>
									<div className='grid grid-cols-2 sm:grid-cols-3 items-center gap-4'>
										<div className='flex flex-col gap-1'>
											<Text size='xs' theme='muted'>
												{t('details.closingDate')}
											</Text>
											<Text size='sm' weight='medium'>
												{formatDate(
													new Date(closingDate),
												)}
											</Text>
										</div>
										<div className='flex flex-col gap-1'>
											<Text size='xs' theme='muted'>
												{t('details.dueDate')}
											</Text>
											<Text size='sm' weight='medium'>
												{formatDate(new Date(dueDate))}
											</Text>
										</div>
										<div className='flex flex-col gap-1 sm:items-end'>
											{totals.length > 0 ? (
												totals.map(
													({
														currencyCode,
														total,
													}) => (
														<Text
															key={currencyCode}
															size='sm'
															weight='medium'
															className='flex items-center gap-1'
														>
															<CurrencyIcon
																currency={
																	currencyCode
																}
																size='sm'
															/>
															{getCurrencySymbol(
																currencyCode,
															)}{' '}
															{formatNumber(
																total,
															)}
														</Text>
													),
												)
											) : (
												<Text size='sm' theme='muted'>
													—
												</Text>
											)}
										</div>
									</div>
								</li>
							),
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
