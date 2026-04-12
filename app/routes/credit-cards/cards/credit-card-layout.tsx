import { Outlet } from 'react-router'

import { PageSection } from '~/components/ui/page'

import { creditCardMiddleware } from '../lib/middleware'

export const middleware = [creditCardMiddleware]

export default function CreditCardLayout() {
	return (
		<PageSection>
			<Outlet />
		</PageSection>
	)
}
