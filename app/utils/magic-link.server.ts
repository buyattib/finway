import { z } from 'zod'
import { encrypt, decrypt } from './encryption.server'

const MagicLinkPayloadSchema = z.object({
	emailAddress: z.string(
		'Sign in link invalid (email is not a string). Please request a new one.',
	),
	creationDate: z
		.string(
			'Sign in link invalid (link expiration is not a string). Please request a new one.',
		)
		.refine(
			val => {
				const linkCreationDate = new Date(val)
				const expirationTime =
					linkCreationDate.getTime() + linkExpirationTime
				return Date.now() < expirationTime
			},
			{ error: 'Magic link expired. Please request a new one.' },
		),
})

type MagicLinkPayload = z.infer<typeof MagicLinkPayloadSchema>

const tokenKey = 'token'
const linkExpirationTime = 1000 * 60 * 15 // 15 minutes

export function createMagicLink({
	emailAddress,
	domainUrl,
}: {
	emailAddress: string
	domainUrl: string
}) {
	const payload: MagicLinkPayload = {
		emailAddress,
		creationDate: new Date().toISOString(),
	}
	const stringToEncrypt = JSON.stringify(payload)
	const encryptedString = encrypt(stringToEncrypt)
	const url = new URL(domainUrl)
	url.pathname = 'authenticate'
	url.searchParams.set(tokenKey, encryptedString)

	return url
}

export async function validateMagicLink(link: string) {
	const url = new URL(link)
	const linkCode = url.searchParams.get(tokenKey) ?? ''

	let parsed
	try {
		const decryptedString = decrypt(linkCode)
		parsed = JSON.parse(decryptedString)
	} catch (error: unknown) {
		console.error(error)
		throw new Error(
			'Sign in link invalid (link payload is invalid). Please request a new one.',
		)
	}

	const payload = MagicLinkPayloadSchema.safeParse(parsed)
	if (!payload.success) throw new Error(payload.error.message)

	return payload.data.emailAddress
}
