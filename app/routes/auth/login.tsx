import { data, Form, redirect, useNavigation } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { LoaderCircleIcon } from 'lucide-react'
import { z } from 'zod'

import type { Route } from './+types/login'

import { database } from '~/database/context'
import { checkHoneypot } from '~/utils/honeypot.server'
import { createToastHeaders } from '~/utils/toast.server'
import { getCurrentUser } from '~/utils/auth.server'

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

const LoginFormSchema = z.object({
	email: z
		.email({ message: 'Email is invalid' })
		.min(3, { message: 'Email is too short' })
		.max(100, { message: 'Email is too long' })
		.transform(value => value.toLowerCase()),
	remember: z.boolean().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
	const cookie = request.headers.get('Cookie')
	const user = await getCurrentUser(cookie)

	if (user) return redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
	const db = database()

	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: LoginFormSchema,
		async: true,
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 400 })
	}

	const user = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.email, submission.value.email),
	})

	// TODO: send email link and set toast with message
	// TODO: set remember as a query string in the link
	// submission.value.remember
	const cookie = request.headers.get('Cookie')
	const toastHeaders = await createToastHeaders(cookie, {
		type: 'success',
		title: user ? 'Welcome back!' : 'Welcome to Finhub!',
		description: 'We sent you an email with a link to log in',
	})

	return data({ submission: submission.reply() }, { headers: toastHeaders })
}

export default function Login({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation()
	const isSubmitting =
		navigation.formAction === '/login' && navigation.state === 'submitting'

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginFormSchema),
		lastResult: actionData?.submission,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema })
		},
	})

	return (
		<>
			<title>Login to Finhub</title>

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
		</>
	)
}
