import { encrypt, decrypt } from './encryption.server'

type MagicLinkPayload = {
	emailAddress: string
	creationDate: string
}

const tokenKey = 'token'
const linkExpirationTime = 1000 * 60 * 30

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

	let emailAddress, linkCreationDateString
	try {
		const decryptedString = decrypt(linkCode)
		const payload = JSON.parse(decryptedString) as MagicLinkPayload

		emailAddress = payload.emailAddress
		linkCreationDateString = payload.creationDate
	} catch (error: unknown) {
		console.error(error)
		throw new Error(
			'Sign in link invalid (link payload is invalid). Please request a new one.',
		)
	}

	if (typeof emailAddress !== 'string') {
		console.error(`Email is not a string.`)
		throw new Error(
			'Sign in link invalid (email is not a string). Please request a new one.',
		)
	}

	if (typeof linkCreationDateString !== 'string') {
		console.error('Link expiration is not a string.')
		throw new Error(
			'Sign in link invalid (link expiration is not a string). Please request a new one.',
		)
	}

	const linkCreationDate = new Date(linkCreationDateString)
	const expirationTime = linkCreationDate.getTime() + linkExpirationTime
	if (Date.now() > expirationTime) {
		throw new Error('Magic link expired. Please request a new one.')
	}
	return emailAddress
}
