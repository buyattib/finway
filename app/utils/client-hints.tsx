import { useRevalidator } from 'react-router'
import { useEffect } from 'react'
import { getHintUtils, type ClientHint } from '@epic-web/client-hints'

import {
	clientHint as colorSchemeHint,
	subscribeToSchemeChange,
} from '@epic-web/client-hints/color-scheme'
import { clientHint as timeZoneHint } from '@epic-web/client-hints/time-zone'

import { MOBILE_BREAKPOINT } from '~/hooks/use-mobile'

const languageHint = {
	cookieName: 'CH-language',
	getValueCode: `navigator.language || navigator.languages?.[0]`,
	fallback: 'en-US',
	transform(value: string) {
		return value.toLowerCase().split('-')[0]
	},
} as const satisfies ClientHint<string>

const isMobileHint = {
	cookieName: 'CH-mobile',
	// getValueCode: `(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/).test(navigator.userAgent).toString()`,
	getValueCode: `window.matchMedia('(max-width: ${MOBILE_BREAKPOINT - 1}px)').matches ? 'true' : 'false'`,
	fallback: false,
	transform(value: string) {
		return value === 'true'
	},
} as const satisfies ClientHint<boolean>

const hintsUtils = getHintUtils({
	theme: colorSchemeHint,
	timeZone: timeZoneHint,
	languageHint,
	isMobileHint,
})

export const { getHints } = hintsUtils

export function ClientHintCheck({ nonce }: { nonce: string | undefined }) {
	const { revalidate } = useRevalidator()
	useEffect(() => subscribeToSchemeChange(() => revalidate()), [revalidate])

	return (
		<script
			nonce={nonce}
			dangerouslySetInnerHTML={{
				__html: hintsUtils.getClientHintCheckScript(),
			}}
		/>
	)
}
