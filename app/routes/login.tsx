import { data, Form, redirect, useNavigation } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { z } from 'zod'
import { LoaderCircleIcon } from 'lucide-react'

import type { Route } from './+types/login'

import { checkHoneypot } from '~/utils/honeypot'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ErrorList, Field } from '~/components/forms'

const LoginFormSchema = z.object({
	email: z
		.email({ message: 'Email is invalid' })
		.min(3, { message: 'Email is too short' })
		.max(100, { message: 'Email is too long' })
		.transform(value => value.toLowerCase()),
})

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: LoginFormSchema,
		async: true,
	})
	if (submission.status !== 'success') {
		return data(
			{
				submission: submission.reply(),
			},
			{ status: 400 },
		)
	}

	return redirect('/')
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
