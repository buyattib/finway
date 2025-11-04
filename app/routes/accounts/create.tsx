import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect, Link } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { and, eq } from 'drizzle-orm'

import type { Route } from './+types/create'

import { account, subAccount } from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'

import { AccountForm } from './components/form'
import { AccountFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Create Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Create Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Create accounts to track your expenses',
		},
	]
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: AccountFormSchema.transform(data => ({
			...data,
			subAccounts: data.subAccounts.map(sa => ({
				...sa,
				balance: Number(sa.balance) * 100,
			})),
		})),
		async: true,
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	const existingAccounts = await db.$count(
		account,
		and(
			eq(account.ownerId, user.id),
			eq(account.name, body.name),
			eq(account.accountType, body.accountType),
		),
	)
	if (existingAccounts > 0) {
		return data(
			{
				submission: submission.reply({
					formErrors: [
						'An account with this name and type already exists',
					],
				}),
			},
			{ status: 422 },
		)
	}

	const { subAccounts, ...accountData } = body

	const accountId = await db.transaction(async tx => {
		const [newAccount] = await tx
			.insert(account)
			.values({ ...accountData, ownerId: user.id })
			.returning({ id: account.id })

		const accountId = newAccount.id
		await tx.insert(subAccount).values(
			subAccounts.map(sa => ({
				...sa,
				accountId,
			})),
		)

		return accountId
	})

	return redirect(`/app/accounts/${accountId}`)
}

export default function CreateAccount({ actionData }: Route.ComponentProps) {
	return (
		<>
			<Button asChild variant='link'>
				<Link to='..' relative='path'>
					<ArrowLeftIcon />
					Back
				</Link>
			</Button>
			<div className='flex justify-center'>
				<AccountForm lastResult={actionData?.submission} />
			</div>
		</>
	)
}
