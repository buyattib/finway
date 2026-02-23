export default {
	index: {
		meta: {
			title: 'Transactions | Finway',
			description: 'Your Transactions',
		},
		title: 'Transactions ({{total}})',
		addTransactionLabel: 'Transaction',
		emptyMessage:
			'You have not created any transactions yet. Start creating them <0>here</0>.',
		emptyFilteredMessage: 'No transactions found with applied filters',
		table: {
			date: 'Date',
			account: 'Account',
			category: 'Category',
			type: 'Type',
			amount: 'Amount',
		},
		editAriaLabel: 'Edit transaction',
		deleteAriaLabel: 'Delete transaction',
		action: {
			deleteErrorToast: 'Could not delete transaction',
			deleteErrorToastDescription: 'Please try again',
			notFoundError: 'Transaction {{transactionId}} not found',
			negativeBalanceError:
				'Cannot delete transaction as account would hold a negative balance',
			successToast: 'Transaction deleted',
		},
	},
	filters: {
		account: 'Filter by account',
		currency: 'Filter by currency',
		category: 'Filter by category',
		type: 'Filter by type',
	},
	form: {
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
		resetButton: 'Reset',
		noAccountMessage:
			'You need to create an account first. Do it <0>here</0>',
		noCategoryMessage:
			'You need to create a transaction category first. Do it <0>here</0>',
		schema: {
			dateRequired: 'Date is required',
			transactionTypeRequired: 'Transaction type is required',
			amountRequired: 'Amount is required',
			amountInvalid: 'Amount must be a valid number',
			amountPositive: 'Amount must be greater than zero',
			accountRequired: 'Account is required',
			currencyRequired: 'Currency is required',
			categoryRequired: 'Category is required',
		},
		create: {
			meta: {
				title: 'Create a transaction | Finway',
				description:
					'Create a transaction to track your income and expenses',
			},
			action: {
				successToast: 'Transaction created successfully',
				accountNotFound: 'Account not found',
				currencyNotFound: 'Currency not found',
				categoryNotFound: 'Transaction category not found',
				insufficientBalance:
					'Insufficient balance for the selected account and currency',
			},
			title: 'Create a transaction',
			submitButton: 'Create',
		},
		edit: {
			meta: {
				title: 'Edit transaction {{transactionId}} | Finway',
				description: 'Edit transaction {{transactionId}} | Finway',
			},
			action: {
				successToast: 'Transaction edited successfully',
				transactionNotFound: 'Transaction not found',
				accountNotFound: 'Account not found',
				currencyNotFound: 'Currency not found',
				categoryNotFound: 'Transaction category not found',
				insufficientBalance:
					'Insufficient balance for the selected account and currency',
			},
			title: 'Edit transaction',
			submitButton: 'Update',
		},
	},
}
