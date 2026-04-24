import type { ResourceLanguage } from 'i18next'

import auth from '~/routes/auth/lib/locales/es'
import emails from './emails'
import accounts from '~/routes/accounts/lib/locales/es'
import dashboard from '~/routes/dashboard/lib/locales/es'
import exchanges from '~/features/exchanges/locales/es'
import transfers from '~/features/transfers/locales/es'
import transactions from '~/features/transactions/locales/es'
import movements from '~/routes/movements/lib/locales/es'
import creditCards from '~/routes/credit-cards/lib/locales/es'
import components from './components'
import constants from './constants'

export default {
	components,
	constants,
	auth,
	emails,
	accounts,
	dashboard,
	exchanges,
	transfers,
	transactions,
	movements,
	'credit-cards': creditCards,
} satisfies ResourceLanguage
