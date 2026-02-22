import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Link, Form, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Route as EditRoute } from '../+types/edit'

import { ACCOUNT_TYPES, ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { ErrorList, TextField, SelectField } from '~/components/forms'
import { AccountTypeIcon } from '~/components/account-type-icon'

import { AccountFormSchema } from '../lib/schemas'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props = {
	lastResult?: SubmissionResult
	initialData: Partial<TInitialData>
	action: typeof ACTION_CREATION | typeof ACTION_EDITION
	redirectTo?: string
}

export function AccountForm({
	lastResult,
	initialData,
	action,
	redirectTo,
}: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['accounts', 'components'])

	const isSubmitting =
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	const { title, buttonLabel } = {
		[ACTION_CREATION]: {
			title: t('form.create.title'),
			buttonLabel: t('form.create.submitButton'),
		},
		[ACTION_EDITION]: {
			title: t('form.edit.title'),
			buttonLabel: t('form.edit.submitButton'),
		},
	}[action]

	const [form, fields] = useForm({
		lastResult,
		id: 'account-form',
		shouldValidate: 'onBlur',
		defaultValue: initialData,
		constraint: getZodConstraint(AccountFormSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AccountFormSchema })
		},
	})

	return (
		<Card className='md:max-w-2xl w-full mx-auto'>
			<CardHeader>
				<div className='flex items-center gap-4'>
					<Button asChild variant='link' width='fit' size='icon'>
						<Link to='..' relative='path'>
							<ArrowLeftIcon />
						</Link>
					</Button>
					<CardTitle>{title}</CardTitle>
				</div>
				<CardDescription>{t('form.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form
					{...getFormProps(form)}
					method='post'
					className='flex flex-col gap-1'
				>
					{/* Have first button to be submit */}
					<button type='submit' className='hidden' />

					<input type='hidden' name='action' value={action} />

					{action === ACTION_CREATION && (
						<input
							type='hidden'
							name='redirectTo'
							value={redirectTo}
						/>
					)}

					{action === ACTION_EDITION && (
						<input type='hidden' name='id' value={initialData.id} />
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
						items={ACCOUNT_TYPES.map(i => ({
							icon: <AccountTypeIcon size='sm' accountType={i} />,
							value: i,
							label: t(`components:accountType.${i}`),
						}))}
					/>
				</Form>
			</CardContent>
			<CardFooter className='gap-2'>
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
			</CardFooter>
		</Card>
	)
}
