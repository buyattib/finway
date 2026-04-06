import { Link, Outlet, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'

import type { Route } from './+types/credit-card-layout'

import { creditCardContext } from './lib/context'

import { Button } from '~/components/ui/button'
import { PageSection } from '~/components/ui/page'
import { CreditCard } from '~/components/credit-card'

import { creditCardMiddleware } from './lib/middleware'

export const middleware = [creditCardMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const creditCard = context.get(creditCardContext)
	return { creditCard }
}

export default function CreditCardLayout({
	loaderData: { creditCard },
}: Route.ComponentProps) {
	const location = useLocation()
	const isTransactionDetail = location.pathname.includes('/transactions/')
	const backTo = isTransactionDetail
		? `/app/credit-cards/${creditCard.id}`
		: '/app/credit-cards'

	return (
		<PageSection id={creditCard.id}>
			<Button asChild variant='link' width='fit' size='icon'>
				<Link to={backTo}>
					<ArrowLeftIcon />
				</Link>
			</Button>
			<CreditCard
				brand={creditCard.brand}
				last4={creditCard.last4}
				expiryMonth={creditCard.expiryMonth}
				expiryYear={creditCard.expiryYear}
				closingDate={creditCard.closingDate}
				dueDate={creditCard.dueDate}
				accountName={creditCard.accountName}
				className='w-full max-w-sm shrink-0'
			/>
			<Outlet />
		</PageSection>
	)
}
