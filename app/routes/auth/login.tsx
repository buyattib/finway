import { data, Form, useNavigation, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/login'

import { dbContext } from '~/lib/context'
import { checkHoneypot } from '~/utils-server/honeypot.server'
import { createToastHeaders } from '~/utils-server/toast.server'
import { requireAnonymous } from '~/utils-server/auth.server'
import { getDomainUrl } from '~/utils-server/misc.server'
import { sendEmail } from '~/utils-server/email.server'
import { getServerT } from '~/utils-server/i18n.server'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { CheckboxField, ErrorList, TextField } from '~/components/forms'

import LoginEmail from '~/emails/login'

import { createMagicLink } from './server/magic-link.server'
import { createLoginFormSchema } from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	await requireAnonymous(request, context.get(dbContext))
	const t = getServerT(context, 'auth')

	return {
		meta: {
			title: t('login.meta.title'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const t = getServerT(context, 'auth')

	await requireAnonymous(request, db)

	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: createLoginFormSchema(t),
		async: true,
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 400 })
	}

	const { email, remember, redirectTo } = submission.value

	const user = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email),
	})

	const magicLink = createMagicLink({
		emailAddress: email,
		domainUrl: getDomainUrl(request),
	})

	if (remember) {
		magicLink.searchParams.set('remember', 'true')
	}

	if (redirectTo) {
		const safeRedirectTo = safeRedirect(redirectTo)
		magicLink.searchParams.set('redirectTo', safeRedirectTo)
	}

	const result = await sendEmail({
		to: email,
		subject: t('login.action.emailSubject'),
		react: (
			<LoginEmail
				url={magicLink.toString()}
				t={getServerT(context, 'emails')}
			/>
		),
	})
	if (result.status === 'error') {
		console.error(result.error)

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('login.action.errorToast'),
			description: t('login.action.errorDescription'),
		})
		return data(
			{ submission: submission.reply() },
			{ headers: toastHeaders },
		)
	}

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: user
			? t('login.action.welcomeBackToast')
			: t('login.action.welcomeToast'),
		description: t('login.action.successDescription'),
	})

	return data(
		{ submission: submission.reply({ resetForm: true }) },
		{ headers: toastHeaders },
	)
}

export default function Login({ actionData }: Route.ComponentProps) {
	const { t } = useTranslation('auth')
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === '/login' && navigation.state === 'submitting'

	const schema = createLoginFormSchema(t)
	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(schema),
		lastResult: actionData?.submission,
		defaultValue: { redirectTo },
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	return (
		<Card className='mx-auto w-full max-w-lg gap-4'>
			<CardHeader>
				<CardTitle>{t('login.title')}</CardTitle>
				<CardDescription>{t('login.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form method='post' {...getFormProps(form)}>
					<HoneypotInputs label={t('login.honeypotLabel')} />

					<TextField
						label={t('login.emailLabel')}
						field={fields.email}
						autoFocus
						autoComplete='email'
						type='email'
						className='lowercase'
					/>

					<CheckboxField
						label={t('login.rememberLabel')}
						field={fields.remember}
					/>

					<input
						{...getInputProps(fields.redirectTo, {
							type: 'hidden',
						})}
					/>

					<ErrorList errors={form.errors} id={form.errorId} />
				</Form>
			</CardContent>
			<CardFooter>
				<Button
					form={form.id}
					type='submit'
					width='full'
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{t('login.submitButton')}
				</Button>
			</CardFooter>
		</Card>
	)
}
