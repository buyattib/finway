import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'

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
		where: (account, { eq }) => eq(account.ownerId, user.id),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.balance)],
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
						<span className='sm:inline hidden'>Account</span>
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

			<ul className='flex flex-col gap-2'>
				{accounts.map(account => (
					<li key={account.id}>
						<AccountLink account={account} />
					</li>
				))}
			</ul>
		</section>
	)
}

function AccountLink({
	account: { id, name, description, accountType, subAccounts },
}: {
	account: Route.ComponentProps['loaderData']['accounts'][number]
}) {
	return (
		<Link
			to={`${id}/edit`}
			prefetch='intent'
			className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-xl p-4 hover:border-primary transition-all'
		>
			<div className='flex flex-col gap-2'>
				<div className='flex items-center gap-2'>
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
			<ul className='flex flex-col gap-2 min-w-7xs' aria-labelledby={id}>
				{subAccounts.map(({ id: subAccId, balance, currency }) => (
					<li
						key={subAccId}
						className='flex items-center justify-start gap-2'
					>
						<Text>{currency}</Text>
						<Text>{balance}</Text>
					</li>
				))}
			</ul>
		</Link>
	)
}
