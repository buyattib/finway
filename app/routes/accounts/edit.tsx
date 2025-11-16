import { data, Link, redirect } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeftIcon } from 'lucide-react'

import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'

import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import { Button } from '~/components/ui/button'

import { AccountFormSchema } from './lib/schemas'
import {
	getAccount,
	getExistingAccountsCount,
	updateUserAccount,
} from './lib/queries'
import { AccountForm } from './components/form'

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
	return { account: accountData }
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

	const { id: accountId } = body
	if (!accountId) {
		return data(
			{
				submission: submission.reply({
					formErrors: ['Account ID is required'],
				}),
			},
			{ status: 400 },
		)
	}

	const existingAccounts = await getExistingAccountsCount(db, {
		userId: user.id,
		name: body.name,
		accountType: body.accountType,
		accountId,
	})
	if (existingAccounts > 0) {
		return data(
			{
				submission: submission.reply({
					formErrors: [
						'Another account with this name and type already exists',
					],
				}),
			},
			{ status: 422 },
		)
	}

	const account = await getAccount(db, accountId)
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					formErrors: ['Account not found'],
				}),
			},
			{ status: 404 },
		)
	}

	await updateUserAccount(db, accountId, body)

	return redirect(`/app/accounts/${accountId}`)
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
