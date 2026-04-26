import { useState } from 'react'
import { createSearchParams, Link, useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
	BanknoteArrowDownIcon,
	EllipsisIcon,
	SquarePenIcon,
	TrashIcon,
} from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'

type Props = {
	id: string
	name: string
}

export function AccountActions({ id, name }: Props) {
	const { t } = useTranslation('accounts')
	const fetcher = useFetcher()
	const [confirmOpen, setConfirmOpen] = useState(false)

	const isDeleting = fetcher.state !== 'idle'

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size='icon-sm'
						variant='ghost'
						className='absolute top-4 right-4'
					>
						<EllipsisIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem asChild>
						<Link to={`${id}/edit`}>
							<SquarePenIcon />
							{t('index.editAction')}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link
							to={{
								pathname: '/app/movements/transactions/create',
								search: createSearchParams({
									accountId: id,
								}).toString(),
							}}
						>
							<BanknoteArrowDownIcon />
							{t('index.transactionAction')}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						variant='destructive'
						onSelect={e => {
							e.preventDefault()
							setConfirmOpen(true)
						}}
					>
						<TrashIcon />
						{t('index.deleteAction')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t('index.deleteConfirm.title', { name })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t('index.deleteConfirm.description')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{t('index.deleteConfirm.cancel')}
						</AlertDialogCancel>
						<fetcher.Form
							method='post'
							action={`/app/accounts/${id}`}
						>
							<input type='hidden' name='accountId' value={id} />
							<AlertDialogAction
								type='submit'
								name='intent'
								value='delete'
								variant='destructive'
								disabled={isDeleting}
							>
								{t('index.deleteConfirm.confirm')}
							</AlertDialogAction>
						</fetcher.Form>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
