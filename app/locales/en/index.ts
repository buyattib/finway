import type { ResourceLanguage } from 'i18next'

import accounts from '~/routes/accounts/lib/locales/en'
import exchanges from '~/routes/exchanges/lib/locales/en'
import transfers from '~/routes/transfers/lib/locales/en'
import transactionCategories from '~/routes/transaction-categories/lib/locales/en'
import components from './components'

export default {
	components,
	accounts,
	exchanges,
	transfers,
	'transaction-categories': transactionCategories,
} satisfies ResourceLanguage
