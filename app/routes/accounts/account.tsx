import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const account = await db.query.account.findFirst({
		where: (account, { eq, and }) =>
			and(eq(account.id, accountId), eq(account.ownerId, user.id)),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.balance)],
				columns: { id: true, currency: true, balance: true },
			},
		},
	})
	if (!account) {
		throw new Response('Account not found', { status: 404 })
	}

	return {
		account: {
			...account,
			subAccounts: account.subAccounts.map(sa => ({
				...sa,
				balance: String(sa.balance / 100),
			})),
		},
	}
}

export default function AccountDetails({ loaderData }: Route.ComponentProps) {
	const {
		account: { id, name, description, accountType, subAccounts },
	} = loaderData
	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center gap-4'>
					<AccountTypeIcon accountType={accountType} />
					<div className='flex flex-col gap-2'>
						<Title id={id} level='h1'>
							{name}
						</Title>
						<Text size='sm' theme='primary'>
							{ACCOUNT_TYPE_LABEL[accountType]}
						</Text>
					</div>
				</div>
				<Text theme='muted'>{description}</Text>
			</div>

			<div className='flex flex-col gap-2'>
				<Title id={id} level='h2'>
					Currency balances
				</Title>
				<ul className='flex flex-col gap-2' aria-labelledby={id}>
					{subAccounts.map(({ id: subAccId, balance, currency }) => (
						<li
							key={subAccId}
							className='flex items-center gap-2 p-2 border border-muted rounded-md'
						>
							<Text className='flex items-center gap-2'>
								<CurrencyIcon currency={currency} size='sm' />
								{CURRENCY_DISPLAY[currency].label}
							</Text>
							<Text>{balance}</Text>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>
						Account with id <b>{params.accountId}</b> not found.
					</p>
				),
			}}
		/>
	)
}
