import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { getFormProps, useForm, type SubmissionResult } from '@conform-to/react'
import { Link, Form, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route as EditRoute } from '../+types/edit'

import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	ErrorList,
	NumberField,
	SelectField,
	TextField,
} from '~/components/forms'

import { CC_BRANDS } from '../../lib/constants'
import { creditCardFormSchema } from '../../lib/schemas'

type TInitialData = EditRoute.ComponentProps['loaderData']['initialData']

type Props = {
	lastResult?: SubmissionResult
	initialData: Partial<TInitialData>
	action: typeof ACTION_CREATION | typeof ACTION_EDITION
}

export function CreditCardForm({ lastResult, initialData, action }: Props) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation('credit-cards')

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
		id: 'credit-card-form',
		shouldValidate: 'onBlur',
		defaultValue: initialData,
		constraint: getZodConstraint(creditCardFormSchema(t)),
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: creditCardFormSchema(t),
			})
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
						label={t('form.institutionLabel')}
						field={fields.institution}
						placeholder={t('form.institutionPlaceholder')}
					/>

					<SelectField
						label={t('form.brandLabel')}
						field={fields.brand}
						placeholder={t('form.brandPlaceholder')}
						items={CC_BRANDS.map(brand => ({
							value: brand,
							label: brand,
						}))}
					/>

					<NumberField
						label={t('form.last4Label')}
						field={fields.last4}
						maxLength={4}
						placeholder={t('form.last4Placeholder')}
					/>

					<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
						<NumberField
							label={t('form.expiryMonthLabel')}
							field={fields.expiryMonth}
							placeholder={t('form.expiryMonthPlaceholder')}
							maxLength={2}
						/>
						<NumberField
							label={t('form.expiryYearLabel')}
							field={fields.expiryYear}
							placeholder={t('form.expiryYearPlaceholder')}
							maxLength={4}
						/>
					</div>
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
