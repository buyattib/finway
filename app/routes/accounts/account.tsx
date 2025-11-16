import { Link, Form, data, redirect } from 'react-router'
import { SquarePenIcon, TrashIcon } from 'lucide-react'
import { useForm, getFormProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/account'

import { dbContext, userContext } from '~/lib/context'
import { formatNumber } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from '~/components/ui/alert-dialog'
import { GeneralErrorBoundary } from '~/components/general-error-boundary'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'
import { getAccount, deleteAccount } from './lib/queries'
import { DeleteFormSchema } from './lib/schemas'

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

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: DeleteFormSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { accountId, intent } = submission.value

	const account = await getAccount(db, accountId)
	if (!account || account.ownerId !== user.id) {
		throw new Response('Account not found', { status: 404 })
	}

	if (intent !== 'delete') {
		return data(
			{
				submission: submission.reply({
					formErrors: ['Invalid intent'],
				}),
			},
			{ status: 422 },
		)
	}

	await deleteAccount(db, accountId)

	return redirect(`/app/accounts`)
}

export default function AccountDetails({
	loaderData: { account },
	actionData,
}: Route.ComponentProps) {
	const { id, name, description, accountType, subAccounts } = account

	const [form] = useForm({
		id: 'delete-account-form',
		lastResult: actionData?.submission,
		constraint: getZodConstraint(DeleteFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: DeleteFormSchema })
		},
	})

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
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									size='icon'
									variant='destructive-outline'
								>
									<TrashIcon />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Delete Account <i>{name}</i>?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will
										permanently delete the account and its
										associated transactions.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<Form method='post' {...getFormProps(form)}>
										<input
											type='hidden'
											name='accountId'
											value={id}
										/>
										<AlertDialogAction
											variant='destructive'
											type='submit'
											name='intent'
											value='delete'
										>
											Delete
										</AlertDialogAction>
									</Form>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
				<Text theme='muted'>{description}</Text>
			</div>

			<div className='flex flex-col gap-2'>
				<Title id={id} level='h2'>
					Currency balances
				</Title>
				<ul className='flex flex-col gap-2' aria-labelledby={id}>
					{subAccounts.map(({ id: subAccId, balance, currency }) => {
						const { symbol, label } = CURRENCY_DISPLAY[currency]
						return (
							<li
								key={subAccId}
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
