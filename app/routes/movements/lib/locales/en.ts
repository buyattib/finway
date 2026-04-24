export default {
	index: {
		meta: {
			title: 'Movements | Finway',
			description: 'Your transactions, transfers and exchanges',
		},
		title: 'Movements',
		createLabel: 'Create',
		tabs: {
			transactions: 'Transactions',
			transfers: 'Transfers',
			exchanges: 'Exchanges',
		},
		transactions: {
			emptyTitle: 'You have not created any transactions yet',
			emptyFilteredMessage: 'No transactions found with applied filters',
			editAriaLabel: 'Edit transaction',
			deleteAriaLabel: 'Delete transaction',
			table: {
				date: 'Date',
				account: 'Account',
				category: 'Category',
				type: 'Type',
				amount: 'Amount',
				actions: 'Actions',
			},
			filters: {
				account: 'Filter by account',
				currency: 'Filter by currency',
				category: 'Filter by category',
				type: 'Filter by type',
			},
		},
		transfers: {
			emptyTitle: 'You have not created any transfers yet',
			emptyFilteredMessage: 'No transfers found with applied filters',
			editAriaLabel: 'Edit transfer',
			deleteAriaLabel: 'Delete transfer',
			table: {
				date: 'Date',
				amount: 'Amount',
				fromAccount: 'From Account',
				toAccount: 'To Account',
				actions: 'Actions',
			},
			filters: {
				fromAccount: 'Filter by from account',
				toAccount: 'Filter by to account',
				currency: 'Filter by currency',
			},
		},
		exchanges: {
			emptyTitle: 'You have not created any exchanges yet',
			emptyFilteredMessage: 'No exchanges found with applied filters',
			editAriaLabel: 'Edit exchange',
			deleteAriaLabel: 'Delete exchange',
			table: {
				date: 'Date',
				account: 'Account',
				from: 'From',
				to: 'To',
				rate: 'Rate',
				actions: 'Actions',
			},
			filters: {
				account: 'Filter by account',
				fromCurrency: 'Filter by from currency',
				toCurrency: 'Filter by to currency',
			},
		},
	},
	dialog: {
		title: 'New movement',
		description: 'Pick the kind of movement you want to record.',
		entityLabel: 'Movement type',
		entityPlaceholder: 'Select a movement type',
		entities: {
			transaction: 'Transaction',
			transfer: 'Transfer',
			exchange: 'Exchange',
		},
	},
	form: {
		common: {
			resetButton: 'Reset',
			createSubmitButton: 'Create',
			editSubmitButton: 'Update',
			availableBalance: 'Available: {{symbol}}{{amount}} {{currency}}',
			noAccountMessage:
				'You need to create an account first. Do it <0>here</0>',
		},
		transaction: {
			description:
				'Incomes and expenses will affect your account balances and are used to track your finances.',
			transactionTypeLabel: 'Transaction Type',
			transactionTypePlaceholder: 'Select an transaction type',
			accountLabel: 'Account',
			accountPlaceholder: 'Select an account',
			currencyLabel: 'Currency',
			currencyPlaceholder: 'Select a currency',
			amountLabel: 'Amount',
			categoryLabel: 'Transaction Category',
			categoryPlaceholder: 'Select a transaction category',
			dateLabel: 'Date',
			descriptionLabel: 'Description (Optional)',
			noCategoryMessage:
				'You need to create a transaction category first. Do it <0>here</0>',
		},
		transfer: {
			description:
				'Transfers will affect your account balances and used to track your finances.',
			dateLabel: 'Date',
			fromAccountLabel: 'From Account',
			toAccountLabel: 'To Account',
			accountPlaceholder: 'Select an account',
			currencyLabel: 'Currency',
			currencyPlaceholder: 'Select a currency',
			amountLabel: 'Amount',
		},
		exchange: {
			description:
				'Exchanges will affect your account balances and be used to track your finances.',
			dateLabel: 'Date',
			accountLabel: 'Account',
			accountPlaceholder: 'Select an account',
			fromCurrencyLabel: 'From Currency',
			toCurrencyLabel: 'To Currency',
			currencyPlaceholder: 'Select a currency',
			fromAmountLabel: 'From Amount',
			toAmountLabel: 'To Amount',
		},
	},
}
