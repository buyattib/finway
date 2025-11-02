import { Link } from 'react-router'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PlusIcon } from 'lucide-react'

export function meta() {
	return [
		{ title: 'Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Your accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const result = await db.query.account.findMany({
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		where: (account, { eq, isNull, and }) =>
			and(eq(account.ownerId, user.id), isNull(account.deletedAt)),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.updatedAt)],
				where: (subAccount, { isNull }) => isNull(subAccount.deletedAt),
				columns: { id: true, currency: true, balance: true },
			},
		},
	})

	const accounts = result.map(account => ({
		...account,
		subAccounts: account.subAccounts.map(sub => ({
			...sub,
			balance: String(sub.balance / 100),
		})),
	}))

	return { accounts }
}

export async function action() {}

export default function Accounts({ loaderData }: Route.ComponentProps) {
	const { accounts } = loaderData

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
					<Link to='create'>
						<PlusIcon aria-hidden />
						<span aria-hidden className='sm:inline hidden'>
							Account
						</span>
						<span className='sr-only'>Create Account</span>
					</Link>
				</Button>
			</div>

			{accounts.length === 0 && (
				<div className='my-2'>
					<Text size='md' weight='medium' alignment='center'>
						{'no-accounts-msg'}
					</Text>
				</div>
			)}

			<ul
				className='flex flex-col gap-2'
				aria-labelledby='accounts-section'
			>
				{accounts.map(account => {
					const { id, name, description, accountType, subAccounts } =
						account
					return (
						<li key={id}>
							<Link
								to={id}
								prefetch='intent'
								className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-xl p-4 hover:border-primary transition-all'
							>
								<div className='flex flex-col gap-2'>
									<div className='flex items-center gap-2'>
										<span className='sr-only'>
											Account {name}
										</span>
										<Title id={id} level='h5'>
											{name}
										</Title>
										<Text size='sm' theme='primary'>
											{`${accountType}-label`}
										</Text>
									</div>
									<Text size='sm' theme='muted'>
										{description}
									</Text>
								</div>
								<ul
									className='flex flex-col gap-2 min-w-7xs'
									aria-labelledby={id}
								>
									{subAccounts.map(subAccount => {
										const { balance, currency } = subAccount
										return (
											<li
												key={subAccount.id}
												className='flex items-center justify-start gap-2'
											>
												<Text>{currency}</Text>
												<Text>{balance}</Text>
												<span className='sr-only'>
													{`${currency}-label`}{' '}
													{balance}
												</span>
											</li>
										)
									})}
								</ul>
							</Link>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
