import { data, Link } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeftIcon } from 'lucide-react'

import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'

import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import { Button } from '~/components/ui/button'

import { AccountFormSchema } from './lib/schemas'
import { AccountForm } from './components/form'

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const account = await db.query.account.findFirst({
		where: (account, { eq, isNull, and }) =>
			and(
				eq(account.id, accountId),
				eq(account.ownerId, user.id),
				isNull(account.deletedAt),
			),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.balance)],
				where: (subAccount, { isNull }) => isNull(subAccount.deletedAt),
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

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: AccountFormSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	console.log(body)
}

export default function EditAccount({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<>
			<Button asChild variant='link'>
				<Link to='..' relative='path'>
					<ArrowLeftIcon />
					Back
				</Link>
			</Button>
			<div className='flex justify-center'>
				<AccountForm
					lastResult={actionData?.submission}
					account={loaderData.account}
				/>
			</div>
		</>
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
