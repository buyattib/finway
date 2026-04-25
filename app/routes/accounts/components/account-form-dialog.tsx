import { useTranslation } from 'react-i18next'
import {
	useFetcher,
	useLocation,
	useNavigate,
	useSearchParams,
} from 'react-router'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'

import type { Route as EditRoute } from '../+types/edit'

import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'
import type { TFormAction } from '~/lib/types'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { ErrorList, TextField, SelectField } from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'

import { USER_SELECTABLE_ACCOUNT_TYPES } from '../lib/constants'
import { createAccountFormSchema } from '../lib/schemas'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props =
	| {
			action: typeof ACTION_CREATION
			initialData: Partial<TInitialData>
			redirectTo?: string
	  }
	| {
			action: typeof ACTION_EDITION
			initialData: TInitialData
	  }

export function AccountFormDialog(props: Props) {
	const { t } = useTranslation(['accounts', 'constants'])
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const fetcher = useFetcher<{ submission?: SubmissionResult }>()

	const close = () =>
		navigate({
			pathname: '/app/accounts',
			search: searchParams.toString(),
		})

	const { title, buttonLabel, formAction } =
		props.action === ACTION_CREATION
			? {
					title: t('form.create.title'),
					buttonLabel: t('form.create.submitButton'),
					formAction: `/app/accounts/create${location.search}`,
				}
			: {
					title: t('form.edit.title'),
					buttonLabel: t('form.edit.submitButton'),
					formAction: `/app/accounts/${props.initialData.id}/edit${location.search}`,
				}

	const [form, fields] = useForm({
		lastResult: fetcher.data?.submission,
		id: 'account-form',
		shouldValidate: 'onBlur',
		defaultValue: props.initialData,
		constraint: getZodConstraint(createAccountFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: createAccountFormSchema(t),
			})
		},
	})

	const isSubmitting = fetcher.state === 'submitting'

	const action: TFormAction = props.action

	return (
		<Dialog open onOpenChange={o => !o && close()}>
			<DialogContent
				className='top-0 left-0 translate-x-0 translate-y-0 w-screen h-dvh max-w-none max-h-dvh rounded-none border-0 overflow-y-auto sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:h-auto sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg sm:border'
				onOpenAutoFocus={e => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{t('form.description')}
					</DialogDescription>
				</DialogHeader>

				<fetcher.Form
					{...getFormProps(form)}
					method='post'
					action={formAction}
					className='flex flex-col gap-1'
				>
					{/* Have first button to be submit */}
					<button type='submit' className='hidden' />

					<input type='hidden' name='action' value={action} />

					{props.action === ACTION_CREATION && (
						<input
							type='hidden'
							name='redirectTo'
							value={props.redirectTo ?? ''}
						/>
					)}

					{props.action === ACTION_EDITION && (
						<input
							type='hidden'
							name='id'
							value={props.initialData.id}
						/>
					)}

					<ErrorList
						size='md'
						errors={form.errors}
						id={form.errorId}
					/>

					<TextField
						autoFocus
						label={t('form.nameLabel')}
						field={fields.name}
					/>
					<TextField
						label={t('form.descriptionLabel')}
						field={fields.description}
					/>
					<SelectField
						label={t('form.accountTypeLabel')}
						field={fields.accountType}
						placeholder={t('form.accountTypePlaceholder')}
						items={USER_SELECTABLE_ACCOUNT_TYPES.map(i => ({
							icon: <AccountTypeIcon size='sm' accountType={i} />,
							value: i,
							label: t(`constants:accountType.${i}`),
						}))}
					/>
				</fetcher.Form>

				<div className='flex gap-2'>
					<Button
						width='full'
						variant='outline'
						{...form.reset.getButtonProps()}
					>
						{t('form.resetButton')}
					</Button>
					<Button
						width='full'
						form={form.id}
						type='submit'
						disabled={isSubmitting}
						loading={isSubmitting}
					>
						{buttonLabel}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
