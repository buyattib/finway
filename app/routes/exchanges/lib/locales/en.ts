export default {
	index: {
		meta: {
			title: 'Exchanges | Finway',
			description: 'Your currency exchanges',
		},
		title: 'Exchanges',
		addExchangeLabel: 'Exchange',
		emptyMessage:
			'You have not created any exchange yet. Start creating them <0>here</0>.',
		table: {
			date: 'Date',
			account: 'Account',
			from: 'From',
			to: 'To',
			rate: 'Rate',
		},
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
			meta: {
				title: 'Create an exchange | Finway',
				description: 'Create a currency exchange to track your money',
			},
			action: {
				successToast: 'Exchange created successfully',
				accountNotFound: 'Account not found',
				fromCurrencyNotFound: 'From currency not found',
				toCurrencyNotFound: 'To currency not found',
				insufficientBalance:
					'Insufficient balance in the selected from currency',
			},
			title: 'Create an exchange',
			submitButton: 'Create',
		},
	},
}
