import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect, Link } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'

import { AccountForm } from './components/form'
import { AccountFormSchema } from './lib/schemas'
import { getExistingAccountsCount, createUserAccount } from './lib/queries'

export function meta() {
	return [
		{ title: 'Create Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Create Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Create accounts to track your transactions',
		},
	]
}

export async function action({ request, context }: Route.ActionArgs) {
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
	const existingAccounts = await getExistingAccountsCount(db, {
		userId: user.id,
		name: body.name,
		accountType: body.accountType,
	})
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

	const accountId = await createUserAccount(db, user.id, body)

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
