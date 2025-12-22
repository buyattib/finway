import { Link, Form, useNavigation } from 'react-router'
import { PlusIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
// import { parseWithZod } from '@conform-to/zod/v4'
import { eq, desc, sql } from 'drizzle-orm'

import type { Route } from './+types'

import {
	transfer as transferTable,
	wallet as walletTable,
	account as accountTable,
} from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { cn, formatDate, formatNumber } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

// import { CURRENCY_DISPLAY } from '~/routes/accounts/lib/constants'

export function meta() {
	return [
		{ title: 'Account Transfers | Finhub' },

		{
			property: 'og:title',
			content: 'Account Transfers | Finhub',
		},
		{
			name: 'description',
			content: 'Your transfers between accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	return {}
}

export default function Transfers({ loaderData: {} }: Route.ComponentProps) {
	// const navigation = useNavigation()

	// const isDeleting =
	// 	navigation.formMethod === 'POST' &&
	// 	navigation.formAction === `/app/transactions?index` &&
	// 	navigation.state === 'submitting' &&
	// 	navigation.formData?.get('intent') === 'delete'

	// const deletingId = navigation.formData?.get('transactionId')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='transfers-section'
		>
			{/* <div className='flex items-center justify-between'>
				<Title id='transfers-section' level='h3'>
					Transfers
				</Title>
				<Button
					asChild
					variant='default'
					autoFocus
					// disabled={isDeleting}
				>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Transaction</span>
					</Link>
				</Button>
			</div>

			<Table>
				{transfers.length === 0 && (
					<TableCaption>
						<Text size='md' weight='medium' alignment='center'>
							You have not created any transfer yet. Start
							creating them{' '}
							<Link to='create' className='text-primary'>
								here
							</Link>
						</Text>
					</TableCaption>
				)}
				{transfers.length !== 0 && (
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead className='text-center'>
								Amount
							</TableHead>
							<TableHead className='text-center'>
								Amount
							</TableHead>
							<TableHead className='text-center'>
								Account
							</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
				)}
				<TableBody>
					{transfers.map(
						({ id, date, amount, fromCurrency, toCurrency }) => {
							// const { symbol } = CURRENCY_DISPLAY[currency]
							// const { label: typeLabel, color: typeColor } =
							// 	TRANSACTION_TYPE_DISPLAY[type]

							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell className='text-center'>
										<b>{currency}</b> {formatNumber(amount)}
									</TableCell>
									<TableCell className='text-center'>
										{transactionCategory}
									</TableCell>
									<TableCell className='text-center'>
										{account}
									</TableCell>
									<TableCell className='flex justify-end items-center gap-2'>
										<Button
											asChild
											size='icon-xs'
											variant='ghost'
											disabled={isDeleting}
										>
											<Link to={`${id}/edit`}>
												<SquarePenIcon />
											</Link>
										</Button>
										<Form method='post'>
											<input
												type='hidden'
												name='transactionId'
												value={id}
											/>
											<Button
												size='icon-xs'
												variant='destructive-ghost'
												type='submit'
												name='intent'
												value='delete'
												disabled={isDeleting}
											>
												{isDeleting &&
												deletingId === id ? (
													<Spinner
														aria-hidden
														size='sm'
													/>
												) : (
													<TrashIcon aria-hidden />
												)}
												<span className='sr-only'>
													Delete transaction
												</span>
											</Button>
										</Form>
									</TableCell>
								</TableRow>
							)
						},
					)}
				</TableBody>
			</Table> */}
		</section>
	)
}
