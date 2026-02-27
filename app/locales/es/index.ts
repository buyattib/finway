import type { ResourceLanguage } from 'i18next'

import auth from '~/routes/auth/lib/locales/es'
import emails from './emails'
import accounts from '~/routes/accounts/lib/locales/es'
import dashboard from '~/routes/dashboard/lib/locales/es'
import exchanges from '~/routes/exchanges/lib/locales/es'
import transfers from '~/routes/transfers/lib/locales/es'
import transactionCategories from '~/routes/transaction-categories/lib/locales/es'
import transactions from '~/routes/transactions/lib/locales/es'
import creditCards from '~/routes/credit-cards/lib/locales/es'
import components from './components'

export default {
	components,
	auth,
	emails,
	accounts,
	dashboard,
	exchanges,
	transfers,
	'transaction-categories': transactionCategories,
	transactions,
	'credit-cards': creditCards,
} satisfies ResourceLanguage
