import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, SquarePenIcon } from 'lucide-react'

import type { Route } from './+types/statement'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext } from '~/lib/context'
import type { TCurrency } from '~/lib/types'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { PAGE_SIZE } from '~/lib/constants'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { PageSection, PageHeader } from '~/components/ui/page'
import { TransactionType } from '~/components/transaction-type'
import { CreditCard } from '~/components/credit-card'
import { CurrencyIcon } from '~/components/currency-icon'
import { TablePagination } from '~/components/table-pagination'

import {
	getStatementById,
	getStatementInstallments,
	getStatementTotalsByCurrency,
} from '../lib/queries'
import { creditCardContext } from '../lib/context'
import { EditStatementModal } from './components/edit-statement-modal'

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
	params: { statementId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const statement = await getStatementById({ db, statementId })
	if (
		!statement ||
		statement.creditCardId !== creditCard.id ||
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
		creditCard: {
			id: creditCard.id,
			brand: creditCard.brand,
			last4: creditCard.last4,
			expiryMonth: creditCard.expiryMonth,
			expiryYear: creditCard.expiryYear,
			accountName: creditCard.accountName,
		},
		statement: {
			id: statement.id,
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
	loaderData: { creditCard, statement, totals, installments, pagination },
}: Route.ComponentProps) {
	const { t, i18n } = useTranslation(['credit-cards', 'constants'])
	const navigate = useNavigate()
	const [editOpen, setEditOpen] = useState(false)

	return (
		<>
			<div className='flex items-center gap-2'>
				<Button asChild variant='link' width='fit' size='icon'>
					<Link to={`/app/credit-cards/${creditCard.id}`}>
						<ArrowLeftIcon />
					</Link>
				</Button>
				<Button
					size='icon'
					variant='outline'
					className='ml-auto'
					onClick={() => setEditOpen(true)}
				>
					<SquarePenIcon aria-hidden />
					<span className='sr-only'>
						{t('statement.details.editButton')}
					</span>
				</Button>
			</div>

			<div className='flex flex-col lg:flex-row lg:items-start gap-6'>
				<CreditCard
					brand={creditCard.brand}
					last4={creditCard.last4}
					expiryMonth={creditCard.expiryMonth}
					expiryYear={creditCard.expiryYear}
					accountName={creditCard.accountName}
					className='w-full shrink-0 md:max-w-sm'
				/>
				<div className='rounded-lg border p-4 flex flex-col gap-3 w-full'>
					<div className='flex flex-col gap-1'>
						<Text size='xs' theme='muted'>
							{t('statement.details.closingDate')}
						</Text>
						<Text size='sm' weight='medium'>
							{formatDate(
								new Date(statement.closingDate),
								i18n.language,
							)}
						</Text>
					</div>
					<div className='flex flex-col gap-1'>
						<Text size='xs' theme='muted'>
							{t('statement.details.dueDate')}
						</Text>
						<Text size='sm' weight='medium'>
							{formatDate(
								new Date(statement.dueDate),
								i18n.language,
							)}
						</Text>
					</div>
					{totals.length > 0 && (
						<div className='flex flex-col gap-2 border-t pt-3'>
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
									{formatNumber(total, i18n.language)}
								</Text>
							))}
						</div>
					)}
				</div>
			</div>

			{editOpen && (
				<EditStatementModal
					onClose={() => setEditOpen(false)}
					creditCardId={creditCard.id}
					statementId={statement.id}
					closingDate={statement.closingDate}
					dueDate={statement.dueDate}
				/>
			)}

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
								category,
								currencyCode,
							}) => (
								<li
									key={id}
									className='rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer'
									onClick={() =>
										navigate(
											`/app/credit-cards/${creditCard.id}/transactions/${transactionId}`,
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
												{t(
													`constants:categories.${category}.name`,
												)}
											</Text>
											{transactionDescription && (
												<Text size='xs' theme='muted'>
													{transactionDescription}
												</Text>
											)}
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
											{formatNumber(
												amount,
												i18n.language,
											)}
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
