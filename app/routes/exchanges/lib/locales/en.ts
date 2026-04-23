export default {
	index: {
		meta: {
			title: 'Exchanges | Finway',
			description: 'Your currency exchanges',
		},
		title: 'Exchanges',
		addExchangeLabel: 'Exchange',
		table: {
			date: 'Date',
			account: 'Account',
			from: 'From',
			to: 'To',
			rate: 'Rate',
			actions: 'Actions',
		},
		emptyTitle: 'You have not created any exchanges yet',
		emptyFilteredMessage: 'No exchanges found with applied filters',
		deleteAriaLabel: 'Delete exchange',
		action: {
			deleteErrorToast: 'Could not delete exchange',
			deleteErrorToastDescription: 'Please try again',
			notFoundError: 'Exchange {{exchangeId}} not found',
			negativeBalanceError:
				'Cannot delete exchange as account would hold a negative balance',
			successToast: 'Exchange deleted',
		},
	},
	filters: {
		account: 'Filter by account',
		fromCurrency: 'Filter by from currency',
		toCurrency: 'Filter by to currency',
	},
	form: {
		description:
			'Exchanges will affect your account balances and be used to track your finances.',
		dateLabel: 'Date',
		accountLabel: 'Account',
		accountPlaceholder: 'Select an account',
		fromCurrencyLabel: 'From Currency',
		toCurrencyLabel: 'To Currency',
		currencyPlaceholder: 'Select a currency',
		fromAmountLabel: 'From Amount',
		availableBalance: 'Available: {{symbol}}{{amount}} {{currency}}',
		toAmountLabel: 'To Amount',
		resetButton: 'Reset',
		noAccountMessage:
			'You need to create an account first. Do it <0>here</0>',
		schema: {
			dateRequired: 'Date is required',
			amountRequired: 'Amount is required',
			amountInvalid: 'Amount must be a valid number',
			amountPositive: 'Amount must be greater than zero',
			fromCurrencyRequired: 'From currency is required',
			toCurrencyRequired: 'To currency is required',
			accountRequired: 'Account is required',
			sameCurrencyError:
				'An exchange can only be done between different currencies',
		},
		create: {
			submitButton: 'Create',
		},
	},
}
