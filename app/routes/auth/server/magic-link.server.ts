import { z } from 'zod'
import type { TFunction } from 'i18next'

import { encrypt, decrypt } from './encryption.server'

const tokenKey = 'token'
export const magicLinkExpirationTime = 1000 * 60 * 15 // 15 minutes

function createMagicLinkPayloadSchema(t: TFunction<'auth'>) {
	return z.object({
		emailAddress: z.string(t('magicLink.invalidEmail')),
		creationDate: z
			.string(t('magicLink.invalidExpiration'))
			.refine(
				val => {
					const linkCreationDate = new Date(val)
					const expirationTime =
						linkCreationDate.getTime() + magicLinkExpirationTime
					return Date.now() < expirationTime
				},
				{ error: t('magicLink.expired') },
			),
	})
}

type MagicLinkPayload = z.infer<ReturnType<typeof createMagicLinkPayloadSchema>>

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

export async function validateMagicLink(
	link: string,
	t: TFunction<'auth'>,
) {
	const url = new URL(link)
	const linkCode = url.searchParams.get(tokenKey) ?? ''

	let parsed
	try {
		const decryptedString = decrypt(linkCode)
		parsed = JSON.parse(decryptedString)
	} catch (error: unknown) {
		console.error(error)
		throw new Error(t('magicLink.invalidPayload'))
	}

	const payload = createMagicLinkPayloadSchema(t).safeParse(parsed)
	if (!payload.success) throw new Error(payload.error.message)

	return payload.data.emailAddress
}
