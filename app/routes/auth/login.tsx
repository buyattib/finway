import { data, Form, useNavigation, useSearchParams } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { LoaderCircleIcon } from 'lucide-react'
import { render } from '@react-email/components'
import { z } from 'zod'

import type { Route } from './+types/login'

import { dbContext } from '~/lib/context'
import { checkHoneypot } from '~/utils/honeypot.server'
import { createToastHeaders } from '~/utils/toast.server'
import { requireAnonymous } from '~/utils/auth.server'
import { getDomainUrl } from '~/utils/misc'
import { createMagicLink } from '~/utils/magic-link.server'
import { sendEmail } from '~/utils/email.server'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { CheckboxField, ErrorList, Field } from '~/components/forms'

import { LoginEmail } from '~/emails/login'

const LoginFormSchema = z.object({
	email: z
		.email({ message: 'Email is invalid' })
		.min(3, { message: 'Email is too short' })
		.max(100, { message: 'Email is too long' })
		.transform(value => value.toLowerCase()),
	remember: z.boolean().optional(),
	redirectTo: z.string().optional(),
})

// export function meta({ error }: Route.MetaArgs) {
// 	return [{ title: 'Login to Finhub' }]
// }

export async function loader({ request, context }: Route.LoaderArgs) {
	await requireAnonymous(request, context.get(dbContext))
}

export async function action({ request, context }: Route.ActionArgs) {
	const db = context.get(dbContext)

	await requireAnonymous(request, db)

	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: LoginFormSchema,
		async: true,
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 400 })
	}

	const { email, remember, redirectTo } = submission.value

	const user = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.email, email),
	})

	// TODO: add an exta validation to check if an email was sent in the last 15 minutes to prevent sending more than one email to the same address
	// For logouts and logins inside the 15 minutes expiration window, just show a toast saying that the latest email link is still valid.

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
		subject: 'Testing',
		text: magicLink.toString(),
		html: await render(<LoginEmail url={magicLink.toString()} />),
	})
	if (result.status === 'error') {
		console.error(result.error)
	}

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: user ? 'Welcome back!' : 'Welcome to Finhub!',
		description: 'We sent you an email with a link to log in',
	})

	return data(
		{ submission: submission.reply({ resetForm: true }) },
		{ headers: toastHeaders },
	)
}

export default function Login({ actionData }: Route.ComponentProps) {
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === '/login' && navigation.state === 'submitting'

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginFormSchema),
		lastResult: actionData?.submission,
		defaultValue: { redirectTo },
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema })
		},
	})

	return (
		<Card className='mx-auto w-full max-w-lg gap-4'>
			<CardHeader>
				<CardTitle>Welcome!</CardTitle>
				<CardDescription>
					We are going to send you an email with a login link
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form method='post' {...getFormProps(form)}>
					<HoneypotInputs label='Please leave this field blank' />

					<Field
						labelProps={{ children: 'Email' }}
						inputProps={{
							...getInputProps(fields.email, {
								type: 'email',
							}),
							autoFocus: true,
							className: 'lowercase',
							autoComplete: 'email',
						}}
						errors={fields.email.errors}
					/>

					<CheckboxField
						labelProps={{
							children: 'Remember me',
						}}
						checkboxProps={getInputProps(fields.remember, {
							type: 'checkbox',
						})}
						errors={fields.remember.errors}
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
				>
					{isSubmitting && (
						<LoaderCircleIcon className='animate-spin' />
					)}
					Submit
				</Button>
			</CardFooter>
		</Card>
	)
}
