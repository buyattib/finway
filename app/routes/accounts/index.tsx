import { useEffect } from 'react'
import { createSearchParams, Form, Link, Outlet, useSubmit } from 'react-router'
import {
	BanknoteArrowDownIcon,
	EllipsisIcon,
	PlusIcon,
	SquarePenIcon,
	WalletIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { Input } from '~/components/ui/input'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { EmptyState } from '~/components/empty-state'

import { getBalancesByAccount, getAccounts } from './lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'accounts')

	const url = new URL(request.url)
	const search = url.searchParams.get('search')

	const balancesByAccount = await getBalancesByAccount({
		db,
		ownerId: user.id,
	})

	const _accounts = await getAccounts({
		db,
		ownerId: user.id,
		search,
	})

	const accounts = _accounts.map(acc => ({
		...acc,
		balances: balancesByAccount[acc.id]
			.filter(({ balance }) => Number(balance) > 0)
			.slice(0, 3),
	}))

	return {
		accounts,
		search,
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export default function Accounts({
	loaderData: { accounts, search },
}: Route.ComponentProps) {
	const submit = useSubmit()
	const { t, i18n } = useTranslation(['accounts', 'constants'])

	useEffect(() => {
		// sync search field with query params value
		const searchField = document.getElementById('search')
		if (searchField instanceof HTMLInputElement) {
			searchField.value = search ?? ''
		}
	}, [search])

	return (
		<PageSection id='accounts-section'>
			<PageHeader>
				<Title id='accounts-section' level='h3'>
					{t('index.title')}
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>
							{t('index.addAccountLabel')}
						</span>
					</Link>
				</Button>
			</PageHeader>

			<PageContent>
				<Form
					id='search-accounts'
					role='search'
					onChange={event => {
						const isFirstSearch = search === null
						submit(event.currentTarget, { replace: !isFirstSearch })
					}}
				>
					<Input
						className='px-6'
						id='search'
						name='search'
						type='search'
						aria-label={t('index.searchPlaceholder')}
						placeholder={t('index.searchPlaceholder')}
						defaultValue={search ?? ''}
					/>
				</Form>

				{accounts.length === 0 && (
					<EmptyState
						icon={WalletIcon}
						title={
							search
								? t('index.emptySearchMessage', { search })
								: t('index.emptyTitle')
						}
						action={
							!search ? (
								<Button asChild>
									<Link to='create'>
										<PlusIcon />
										{t('index.addAccountLabel')}
									</Link>
								</Button>
							) : undefined
						}
					/>
				)}

				<ul className='flex flex-col gap-5'>
					{accounts.map(
						({ id, name, description, accountType, balances }) => (
							<li
								key={id}
								className='relative flex flex-col gap-5 border rounded-xl p-6'
							>
								<div className='flex items-center gap-4 pr-10'>
									<AccountTypeIcon
										accountType={accountType}
									/>
									<div className='flex flex-col gap-0.5'>
										<Link to={id}>
											<Title id={id} level='h5'>
												{name}
											</Title>
										</Link>
										<Text size='sm' theme='primary'>
											{t(
												`constants:accountType.${accountType}`,
											)}
										</Text>
										{description && (
											<Text
												size='xs'
												theme='muted'
												className='mt-1'
											>
												{description}
											</Text>
										)}
									</div>
								</div>

								{balances.length === 0 ? (
									<Text
										size='sm'
										theme='muted'
										className='border-t pt-3'
									>
										{t('index.noBalances')}
									</Text>
								) : (
									<ul
										className='flex flex-col gap-2 border-t pt-3'
										aria-labelledby={id}
									>
										{balances.map(
											({
												id: bId,
												balance,
												currency,
											}) => {
												const symbol =
													getCurrencySymbol(currency)
												const [, currencyId] =
													bId.split('-')
												return (
													<li
														key={bId}
														className='flex items-center justify-between gap-2'
													>
														<Link
															to={{
																pathname:
																	'../transactions/create',
																search: createSearchParams(
																	{
																		accountId:
																			id,
																		currencyId,
																	},
																).toString(),
															}}
														>
															<Text className='flex items-center gap-2'>
																<CurrencyIcon
																	currency={
																		currency
																	}
																	size='sm'
																/>
																{currency}
															</Text>
														</Link>
														<Text
															weight='bold'
															size='lg'
														>
															{symbol}{' '}
															{formatNumber(
																balance,
																i18n.language,
															)}
														</Text>
													</li>
												)
											},
										)}
									</ul>
								)}

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size='icon-sm'
											variant='ghost'
											className='absolute top-4 right-4'
										>
											<EllipsisIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem>
											<SquarePenIcon />
											<Link to={`${id}/edit`}>
												{t('index.editAction')}
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<BanknoteArrowDownIcon />
											<Link
												to={{
													pathname:
														'../transactions/create',
													search: createSearchParams({
														accountId: id,
													}).toString(),
												}}
											>
												{t('index.transactionAction')}
											</Link>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</li>
						),
					)}
				</ul>
			</PageContent>

			<Outlet />
		</PageSection>
	)
}
