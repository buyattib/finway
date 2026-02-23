import type { ResourceLanguage } from 'i18next'

import accounts from '~/routes/accounts/lib/locales/es'
import exchanges from '~/routes/exchanges/lib/locales/es'
import transfers from '~/routes/transfers/lib/locales/es'
import components from './components'

export default {
	components,
	accounts,
	exchanges,
	transfers,
} satisfies ResourceLanguage
