import { data, Link, redirect } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeftIcon } from 'lucide-react'
import { eq, ne, and, inArray } from 'drizzle-orm'

import type { Route } from './+types/edit'

import { account, subAccount } from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { formatNumberWithoutCommas } from '~/lib/utils'

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

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: AccountFormSchema.transform(data => ({
			...data,
			subAccounts: data.subAccounts.map(sa => ({
				...sa,
				balance: Number(formatNumberWithoutCommas(sa.balance)) * 100,
			})),
		})),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const body = submission.value
	const { id: accountId, subAccounts, ...accountData } = body

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

	const existingAccounts = await db.$count(
		account,
		and(
			eq(account.ownerId, user.id),
			eq(account.name, body.name),
			eq(account.accountType, body.accountType),
			ne(account.id, accountId),
		),
	)
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

	const existingAccount = await db.query.account.findFirst({
		columns: { id: true },
		where: (account, { eq, and }) =>
			and(eq(account.id, accountId), eq(account.ownerId, user.id)),
	})
	if (!existingAccount) {
		return data(
			{
				submission: submission.reply({
					formErrors: ['Account not found'],
				}),
			},
			{ status: 404 },
		)
	}

	const existingSubAccounts = (
		await db.query.subAccount.findMany({
			columns: { id: true },
			where: (subAccount, { eq }) => eq(subAccount.accountId, accountId),
		})
	).map(sa => sa.id)

	const toCreate = subAccounts.filter(sa => !sa.id)
	const toDelete = existingSubAccounts.filter(
		id => !subAccounts.find(sa => sa.id === id),
	)

	await db.transaction(async tx => {
		await tx
			.update(account)
			.set(accountData)
			.where(eq(account.id, accountId))

		if (toCreate.length > 0) {
			await tx
				.insert(subAccount)
				.values(toCreate.map(sa => ({ ...sa, accountId })))
		}
		if (toDelete.length > 0) {
			await tx.delete(subAccount).where(inArray(subAccount.id, toDelete))
		}
	})

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
