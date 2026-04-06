import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm, getFormProps } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'

import { Button } from '~/components/ui/button'
import { DateField } from '~/components/forms'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '~/components/ui/dialog'

import { editStatementFormSchema } from '../lib/schemas'

export function EditStatementModal({
	onClose,
	creditCardId,
	statementId,
	closingDate,
	dueDate,
}: {
	onClose: () => void
	creditCardId: string
	statementId: string
	closingDate: string
	dueDate: string
}) {
	const { t } = useTranslation('credit-cards')
	const fetcher = useFetcher<{ submission?: Record<string, unknown> }>()

	const isSubmitting = fetcher.state === 'submitting'

	const [form, fields] = useForm({
		lastResult: fetcher.data?.submission,
		defaultValue: { closingDate, dueDate },
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: editStatementFormSchema(t),
			})
		},
	})

	useEffect(() => {
		if (fetcher.data?.submission?.status === 'success') {
			onClose()
		}
	}, [fetcher.data, onClose])

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t('statement.details.editTitle')}
					</DialogTitle>
					<DialogDescription>
						{t('statement.details.editDescription')}
					</DialogDescription>
				</DialogHeader>
				<fetcher.Form
					method='post'
					action={`/app/credit-cards/${creditCardId}/statements/${statementId}/edit`}
					{...getFormProps(form)}
				>
					<input
						type='hidden'
						name='statementId'
						value={statementId}
					/>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
						<DateField
							field={fields.closingDate}
							label={t('statement.details.closingDate')}
						/>
						<DateField
							field={fields.dueDate}
							label={t('statement.details.dueDate')}
						/>
					</div>
					<DialogFooter className='mt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
						>
							{t('statement.details.editCancelButton')}
						</Button>
						<Button type='submit' loading={isSubmitting}>
							{t('statement.details.editSubmitButton')}
						</Button>
					</DialogFooter>
				</fetcher.Form>
			</DialogContent>
		</Dialog>
	)
}
