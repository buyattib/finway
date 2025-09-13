import { Link, useNavigate } from 'react-router'
import type { Route } from './+types/account'

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

export default function Account({ params }: Route.ComponentProps) {
	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Are you absolutely sure?</DialogTitle>
				<DialogDescription>
					This action cannot be undone. This will permanently delete
					your account and remove your data from our servers.
				</DialogDescription>
			</DialogHeader>
			Account: {params.accountId}
			<DialogFooter>
				<DialogClose asChild>
					<Link to='..'>Close</Link>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	)
}
