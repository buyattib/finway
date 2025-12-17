import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import { formatNumber } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'

export function meta() {
	return [
		{ title: 'Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Your finhub accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const result = await db.query.account.findMany({
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		where: (account, { eq }) => eq(account.ownerId, user.id),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			wallets: {
				orderBy: (wallet, { desc }) => [desc(wallet.balance)],
				columns: { id: true, currency: true, balance: true },
			},
		},
	})

	const accounts = result.map(account => ({
		...account,
		wallets: account.wallets.map(sub => ({
			...sub,
			balance: String(sub.balance / 100),
		})),
	}))

	return { accounts }
}

export default function Accounts({
	loaderData: { accounts },
}: Route.ComponentProps) {
	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='accounts-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='accounts-section' level='h3'>
					Accounts
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Account</span>
					</Link>
				</Button>
			</div>

			{accounts.length === 0 && (
				<div className='my-2'>
					<Text size='md' weight='medium' alignment='center'>
						You have not created any accounts yet. Start creating
						them{' '}
						<Link to='create' className='text-primary'>
							here
						</Link>
					</Text>
				</div>
			)}

			<ul className='flex flex-col gap-2'>
				{accounts.map(
					({ id, name, description, accountType, wallets }) => (
						<li key={id}>
							<Link
								to={id}
								prefetch='intent'
								className='flex flex-col gap-6 sm:flex-row sm:justify-between border rounded-xl p-4 hover:border-primary transition-all min-h-24'
							>
								<div className='flex items-center gap-4'>
									<AccountTypeIcon
										accountType={accountType}
									/>
									<div className='flex flex-col sm:gap-2 gap-4'>
										<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
											<Title id={id} level='h5'>
												{name}
											</Title>
											<Text size='sm' theme='primary'>
												{
													ACCOUNT_TYPE_LABEL[
														accountType
													]
												}
											</Text>
										</div>
										{description && (
											<Text size='sm' theme='muted'>
												{description}
											</Text>
										)}
									</div>
								</div>
								<ul
									className='flex flex-col justify-center gap-2'
									aria-labelledby={id}
								>
									{wallets.map(
										({ id: wId, balance, currency }) => {
											const { symbol } =
												CURRENCY_DISPLAY[currency]
											return (
												<li
													key={wId}
													className='flex items-center justify-between gap-4'
												>
													<Text>
														{`${symbol} ${formatNumber(balance)}`}
													</Text>
													<Text className='flex items-center gap-2'>
														<CurrencyIcon
															currency={currency}
															size='sm'
														/>
														{currency}
													</Text>
												</li>
											)
										},
									)}
								</ul>
							</Link>
						</li>
					),
				)}
			</ul>
		</section>
	)
}
