import { env } from './env.server'

const RESEND_BASE_URL = 'https://api.resend.com'

const successResponse = { status: 'success' } as const

export async function sendEmail(options: {
	to: string
	subject: string
	html?: string
	text: string
}) {
	if (env.NODE_ENV === 'production') {
		console.log(options.text)
		return successResponse
	}

	const email = {
		from: 'finhub.team@gmail.app',
		...options,
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
