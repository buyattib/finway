import { getHintUtils, type ClientHint } from '@epic-web/client-hints'

import { clientHint as colorSchemeHint } from '@epic-web/client-hints/color-scheme'
import { clientHint as timeZoneHint } from '@epic-web/client-hints/time-zone'

import { MOBILE_BREAKPOINT } from '~/hooks/use-mobile'

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
	isMobile: isMobileHint,
})

export const { getHints, getClientHintCheckScript } = hintsUtils
