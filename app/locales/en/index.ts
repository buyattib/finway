import type { ResourceLanguage } from 'i18next'

import accounts from '~/routes/accounts/lib/locales/en'
import exchanges from '~/routes/exchanges/lib/locales/en'
import components from './components'

export default {
	components,
	accounts,
	exchanges,
} satisfies ResourceLanguage
