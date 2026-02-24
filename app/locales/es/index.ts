import type { ResourceLanguage } from 'i18next'

import accounts from '~/routes/accounts/lib/locales/es'
import dashboard from '~/routes/dashboard/lib/locales/es'
import exchanges from '~/routes/exchanges/lib/locales/es'
import transfers from '~/routes/transfers/lib/locales/es'
import transactionCategories from '~/routes/transaction-categories/lib/locales/es'
import transactions from '~/routes/transactions/lib/locales/es'
import components from './components'

export default {
	components,
	accounts,
	dashboard,
	exchanges,
	transfers,
	'transaction-categories': transactionCategories,
	transactions,
} satisfies ResourceLanguage
