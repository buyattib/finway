export default {
	root: {
		meta: {
			title: 'Finway',
			errorTitle: 'Error | Finway',
			description: 'The hub for your finances',
		},
		error: {
			unexpected: 'An unexpected error occurred.',
			notFound: 'The page you were looking for could not be found.',
		},
	},
	layout: {
		nav: {
			dashboard: 'Dashboard',
			accounts: 'Accounts',
			transactions: 'Transactions',
			creditCards: 'Credit Cards',
			transfers: 'Transfers',
			exchanges: 'Exchanges',
			transactionCategories: 'Transaction Categories',
		},
		logoutButton: 'Logout',
	},
	accountType: {
		bank: 'Bank',
		cash: 'Cash',
		'digital-wallet': 'Digital Wallet',
		'crypto-wallet': 'Crypto Wallet',
		broker: 'Broker',
	},
	transactionType: {
		EXPENSE: 'Expense',
		INCOME: 'Income',
	},
	ccTransactionType: {
		CHARGE: 'Charge',
		REFUND: 'Refund',
	},
	currency: {
		USD: 'US Dollar (USD)',
		EUR: 'Euro (EUR)',
		ARS: 'Argentine Peso (ARS)',
		USDT: 'Tether (USDT)',
		USDC: 'USD Coin (USDC)',
		DAI: 'Dai (DAI)',
	},
	ui: {
		close: 'Close',
		toggleSidebar: 'Toggle Sidebar',
		sidebarTitle: 'Sidebar',
		sidebarDescription: 'Displays the mobile sidebar.',
		morePages: 'More pages',
		goToPreviousPage: 'Go to previous page',
		goToNextPage: 'Go to next page',
		themeToggle: 'Theme toggle',
		toggleLanguage: 'Toggle language',
		clear: 'Clear',
	},
}
