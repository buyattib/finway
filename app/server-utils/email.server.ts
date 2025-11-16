import { render, toPlainText } from '@react-email/components'
import { env } from './env.server'

const RESEND_BASE_URL = 'https://api.resend.com'

const successResponse = { status: 'success' } as const

export async function sendEmail({
	to,
	subject,
	react,
	text,
	html: _html,
}: {
	to: string
	subject: string
} & (
	| { html: string; text: string; react?: never }
	| { react: React.ReactElement; html?: never; text?: never }
)) {
	const html = react ? await render(react) : _html

	if (env.NODE_ENV !== 'production') {
		console.log(text)
		console.log(html)

		return successResponse
	}

	const email = {
		from: 'finhub.team@gmail.app',
		to,
		subject,
		html,
		text,
	}

	const url = RESEND_BASE_URL + '/emails'
	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(email),
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
	})

	if (response.ok) {
		return successResponse
	}

	const data = await response.json()
	return {
		status: 'error',
		error: (data.error || data.message) as string,
	} as const
}
