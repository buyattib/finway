import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types/statement'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext } from '~/lib/context'
import type { TCurrency } from '~/lib/types'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { PAGE_SIZE } from '~/lib/constants'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { PageSection, PageHeader } from '~/components/ui/page'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import { TablePagination } from '~/components/table-pagination'

import {
	getStatementById,
	getStatementInstallments,
	getStatementTotalsByCurrency,
} from '../lib/queries'
import { creditCardContext } from '../lib/context'

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
	params: { creditCardId, statementId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const statement = await getStatementById({ db, statementId })
	if (
		!statement ||
		statement.creditCardId !== creditCardId ||
		statement.closingDate > creditCard.closingDate
	) {
		throw new Response(t('statement.details.loader.notFoundError'), {
			status: 404,
		})
	}

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')

	const [{ installments, total }, currencyTotals] = await Promise.all([
		getStatementInstallments({
			db,
			statementId,
			page,
			pageSize: PAGE_SIZE,
		}),
		getStatementTotalsByCurrency({ db, statementId }),
	])

	return {
		creditCardId,
		statement: {
			closingDate: statement.closingDate,
			dueDate: statement.dueDate,
		},
		totals: currencyTotals.map(t => ({
			currencyCode: t.currencyCode,
			total: String(Number(t.total) / 100),
		})),
		installments: installments.map(i => ({
			...i,
			amount: String(i.amount / 100),
		})),
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
		meta: {
			title: t('statement.details.meta.title', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		},
	}
}

export default function StatementDetails({
	loaderData: { creditCardId, statement, totals, installments, pagination },
}: Route.ComponentProps) {
	const { t } = useTranslation('credit-cards')
	const navigate = useNavigate()

	return (
		<>
			<div className='rounded-lg border p-4 flex flex-col gap-3'>
				<div className='grid grid-cols-2 gap-4'>
					<div className='flex flex-col gap-1'>
						<Text size='xs' theme='muted'>
							{t('statement.details.closingDate')}
						</Text>
						<Text size='sm' weight='medium'>
							{formatDate(new Date(statement.closingDate))}
						</Text>
					</div>
					<div className='flex flex-col gap-1'>
						<Text size='xs' theme='muted'>
							{t('statement.details.dueDate')}
						</Text>
						<Text size='sm' weight='medium'>
							{formatDate(new Date(statement.dueDate))}
						</Text>
					</div>
				</div>
				{totals.length > 0 && (
					<div className='flex items-center gap-4 border-t pt-3'>
						{totals.map(({ currencyCode, total }) => (
							<Text
								key={currencyCode}
								size='sm'
								weight='medium'
								className='flex items-center gap-1'
							>
								<CurrencyIcon
									currency={currencyCode as TCurrency}
									size='sm'
								/>
								{getCurrencySymbol(currencyCode)}{' '}
								{formatNumber(total)}
							</Text>
						))}
					</div>
				)}
			</div>

			<PageSection id='statement-installments-section'>
				<PageHeader>
					<Title id='statement-installments-section' level='h3'>
						{t('statement.details.installmentsTitle', {
							total: pagination.total,
						})}
					</Title>
				</PageHeader>

				{installments.length === 0 ? (
					<Text size='md' weight='medium' alignment='center'>
						{t('statement.details.emptyInstallments')}
					</Text>
				) : (
					<ul className='flex flex-col gap-2'>
						{installments.map(
							({
								id,
								installmentNumber,
								totalInstallments,
								amount,
								transactionId,
								transactionType,
								transactionDescription,
								categoryName,
								currencyCode,
							}) => (
								<li
									key={id}
									className='rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer'
									onClick={() =>
										navigate(
											`/app/credit-cards/${creditCardId}/transactions/${transactionId}`,
										)
									}
								>
									<div className='grid grid-cols-2 sm:grid-cols-4 items-center gap-4'>
										<div className='flex flex-col gap-1'>
											<Text
												size='sm'
												weight='medium'
												className='truncate'
											>
												{transactionDescription ||
													categoryName}
											</Text>
											<Text size='xs' theme='muted'>
												{categoryName}
											</Text>
										</div>
										<TransactionType
											variant='icon-text'
											size='xs'
											transactionType={transactionType}
										/>
										<Text size='xs' theme='muted'>
											{t(
												'statement.details.installmentOf',
												{
													number: installmentNumber,
													total: totalInstallments,
												},
											)}
										</Text>
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
											{getCurrencySymbol(currencyCode)}{' '}
											{formatNumber(amount)}
										</Text>
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
