export default {
	index: {
		action: {
			notFoundError: 'Exchange {{exchangeId}} not found',
			negativeBalanceError:
				'Cannot delete exchange as account would hold a negative balance',
			successToast: 'Exchange deleted',
		},
	},
	form: {
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
			successToast: 'Exchange created successfully',
			accountNotFound: 'Account not found',
			fromCurrencyNotFound: 'From currency not found',
			toCurrencyNotFound: 'To currency not found',
			insufficientBalance:
				'Insufficient balance in the selected from currency',
		},
		edit: {
			successToast: 'Exchange edited successfully',
			exchangeNotFound: 'Exchange not found',
			accountNotFound: 'Account not found',
			fromCurrencyNotFound: 'From currency not found',
			toCurrencyNotFound: 'To currency not found',
			insufficientBalance:
				'Insufficient balance in the selected from currency',
			invalidActionError: 'Invalid action',
		},
	},
}
