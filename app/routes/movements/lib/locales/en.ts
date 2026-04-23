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
	create: {
		transactions: {
			action: {
				successToast: 'Transaction created successfully',
				accountNotFound: 'Account not found',
				currencyNotFound: 'Currency not found',
				insufficientBalance:
					'Insufficient balance for the selected account and currency',
				invalidActionError: 'Invalid action',
			},
		},
		transfers: {
			action: {
				successToast: 'Transfer created successfully',
				fromAccountNotFound: 'From account not found',
				toAccountNotFound: 'To account not found',
				currencyNotFound: 'Currency not found',
				insufficientBalance:
					'Insufficient balance in the selected currency on the from account',
			},
		},
		exchanges: {
			action: {
				successToast: 'Exchange created successfully',
				accountNotFound: 'Account not found',
				fromCurrencyNotFound: 'From currency not found',
				toCurrencyNotFound: 'To currency not found',
				insufficientBalance:
					'Insufficient balance in the selected from currency',
			},
		},
	},
}
