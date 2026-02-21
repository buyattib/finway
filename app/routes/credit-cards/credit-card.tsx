import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { CreditCardIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'

import type { Route } from './+types/credit-card'

import { dbContext, userContext } from '~/lib/context'
import { creditCard as creditCardTable } from '~/database/schema'
import { CURRENCY_DISPLAY } from '~/lib/constants'
import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

import { DeleteCreditCardFormSchema } from './lib/schemas'

export function meta({ loaderData, params: { creditCardId } }: Route.MetaArgs) {
	if (!loaderData?.creditCard) {
		return [
			{
				title: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				property: 'og:title',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				name: 'description',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
		]
	}

	const {
		creditCard: { brand, last4 },
	} = loaderData

	return [
		{
			title: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			property: 'og:title',
			content: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			name: 'description',
			content: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
	]
}

export async function loader({
	context,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const creditCard = await db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: {
			id: true,
			brand: true,
			last4: true,
			expiryMonth: true,
			expiryYear: true,
		},
		with: {
			account: {
				columns: { name: true, ownerId: true },
			},
			currency: {
				columns: { code: true },
			},
		},
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response('Credit card not found', { status: 404 })
	}

	const {
		account: { ownerId, ...account },
		currency,
		...creditCardData
	} = creditCard

	return {
		creditCard: {
			...creditCardData,
			accountName: account.name,
			currencyCode: currency.code,
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteCreditCardFormSchema,
	})

	if (submission.status !== 'success') {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete credit card',
			description: 'Please try again',
		})

		return data({}, { headers: toastHeaders })
	}

	const { creditCardId } = submission.value
	const creditCard = await db.query.creditCard.findFirst({
		where: eq(creditCardTable.id, creditCardId),
		columns: { brand: true, last4: true },
		with: {
			account: { columns: { ownerId: true } },
		},
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response('Credit card not found', { status: 404 })
	}

	await db.delete(creditCardTable).where(eq(creditCardTable.id, creditCardId))

	return await redirectWithToast('/app/credit-cards', request, {
		type: 'success',
		title: `Credit card ${creditCard.brand} •••• ${creditCard.last4} deleted`,
	})
}

export default function CreditCardDetails({
	loaderData: {
		creditCard: {
			id,
			brand,
			last4,
			expiryMonth,
			expiryYear,
			accountName,
			currencyCode,
		},
	},
}: Route.ComponentProps) {
	const { label } = CURRENCY_DISPLAY[currencyCode]
	const location = useLocation()
	const navigation = useNavigation()
	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center gap-4'>
					<CreditCardIcon className='size-8 text-muted-foreground' />
					<div className='flex flex-col gap-2'>
						<Title id={id} level='h1'>
							{brand} •••• {last4}
						</Title>
						<div className='flex items-center gap-4'>
							<Text size='md' theme='primary'>
								Expires {expiryMonth}/{expiryYear}
							</Text>
							<Text size='sm' theme='muted'>
								·
							</Text>
							<Text size='md' theme='muted'>
								{accountName}
							</Text>
							<Text size='sm' theme='muted'>
								·
							</Text>
							<Text
								size='md'
								theme='muted'
								className='flex items-center gap-1'
							>
								<CurrencyIcon
									currency={currencyCode}
									size='sm'
								/>
								{label}
							</Text>
						</div>
					</div>
					<div className='flex items-center gap-2 ml-auto'>
						<Button size='icon' variant='outline' asChild>
							<Link to='edit' prefetch='intent'>
								<SquarePenIcon />
								<span className='sr-only'>
									Edit {brand} •••• {last4}
								</span>
							</Link>
						</Button>
						<Tooltip>
							<Form method='post'>
								<input
									type='hidden'
									name='creditCardId'
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
											Delete credit card {brand} ••••{' '}
											{last4}
										</span>
									</Button>
								</TooltipTrigger>
							</Form>
							<TooltipContent>
								Deleting a credit card cannot be undone.
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	)
}
