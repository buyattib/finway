import type { ResourceLanguage } from 'i18next'

import auth from '~/routes/auth/lib/locales/en'
import accounts from '~/routes/accounts/lib/locales/en'
import dashboard from '~/routes/dashboard/lib/locales/en'
import exchanges from '~/routes/exchanges/lib/locales/en'
import transfers from '~/routes/transfers/lib/locales/en'
import transactionCategories from '~/routes/transaction-categories/lib/locales/en'
import transactions from '~/routes/transactions/lib/locales/en'
import creditCards from '~/routes/credit-cards/lib/locales/en'
import components from './components'

export default {
	components,
	auth,
	accounts,
	dashboard,
	exchanges,
	transfers,
	'transaction-categories': transactionCategories,
	transactions,
	'credit-cards': creditCards,
} satisfies ResourceLanguage
