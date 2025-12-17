import { Link, Form, data, useNavigation } from 'react-router'
import { SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'
import type { Route } from './+types/account'

import { dbContext, userContext } from '~/lib/context'
import { account as accountTable } from '~/database/schema'
import { formatNumber } from '~/lib/utils'
import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'
import { DeleteAccountFormSchema } from './lib/schemas'
import { getAccount } from './lib/queries'

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const account = await getAccount(db, accountId)
	if (!account || account.ownerId !== user.id) {
		throw new Response('Account not found', { status: 404 })
	}

	const { ownerId, ...accountData } = account
	return {
		account: {
			...accountData,
			wallets: account.wallets.map(w => ({
				...w,
				balance: String(w.balance / 100),
			})),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteAccountFormSchema,
	})

	if (submission.status !== 'success') {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete account',
			description: 'Please try again',
		})

		return data({}, { headers: toastHeaders })
	}

	const account = await getAccount(db, submission.value.accountId)
	if (!account || account.ownerId !== user.id) {
		throw new Response('Account not found', { status: 404 })
	}

	await db.delete(accountTable).where(eq(accountTable.id, account.id))

	return await redirectWithToast('/app/accounts', request, {
		type: 'success',
		title: `Account ${account.name} deleted`,
	})
}

export default function AccountDetails({
	loaderData: { account },
}: Route.ComponentProps) {
	const { id, name, description, accountType, wallets } = account

	const navigation = useNavigation()
	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/accounts/${id}` &&
		navigation.state === 'submitting'

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
					<div className='flex items-center gap-2 ml-auto'>
						<Button size='icon' variant='outline' asChild>
							<Link to='edit' prefetch='intent'>
								<SquarePenIcon />
							</Link>
						</Button>
						<Tooltip>
							<Form method='post'>
								<input
									type='hidden'
									name='accountId'
									value={id}
								/>
								<TooltipTrigger asChild>
									<Button
										size='icon'
										variant='destructive-outline'
										type='submit'
										name='intent'
										value='delete'
										disabled={isDeleting}
									>
										{isDeleting ? (
											<Spinner size='sm' />
										) : (
											<TrashIcon aria-hidden />
										)}
										<span className='sr-only'>
											Delete account {name}
										</span>
									</Button>
								</TooltipTrigger>
							</Form>
							<TooltipContent>
								Deleting an account cannot be undone and it
								deletes all its transactions.
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
				<Text theme='muted'>{description}</Text>
			</div>

			<div className='flex flex-col gap-2'>
				<Title id={id} level='h2'>
					Currency balances
				</Title>
				<ul className='flex flex-col gap-2' aria-labelledby={id}>
					{wallets.map(({ id: wId, balance, currency }) => {
						const { symbol, label } = CURRENCY_DISPLAY[currency]
						return (
							<li
								key={wId}
								className='flex items-center justify-between gap-4 p-4 border border-muted rounded-md'
							>
								<Text className='flex items-center gap-2'>
									<CurrencyIcon
										currency={currency}
										size='md'
									/>
									{label}
								</Text>
								<Text>
									{`${symbol} ${formatNumber(balance)}`}
								</Text>
							</li>
						)
					})}
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
