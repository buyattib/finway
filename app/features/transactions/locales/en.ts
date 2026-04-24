export default {
	index: {
		action: {
			notFoundError: 'Transaction {{transactionId}} not found',
			negativeBalanceError:
				'Cannot delete transaction as account would hold a negative balance',
			successToast: 'Transaction deleted',
		},
	},
	form: {
		schema: {
			dateRequired: 'Date is required',
			dateFuture: 'Date cannot be in the future',
			transactionTypeRequired: 'Transaction type is required',
			amountRequired: 'Amount is required',
			amountInvalid: 'Amount must be a valid number',
			amountPositive: 'Amount must be greater than zero',
			accountRequired: 'Account is required',
			currencyRequired: 'Currency is required',
			categoryRequired: 'Category is required',
			categoryInvalidForType:
				'Category is not valid for the selected transaction type',
		},
		create: {
			successToast: 'Transaction created successfully',
			accountNotFound: 'Account not found',
			currencyNotFound: 'Currency not found',
			insufficientBalance:
				'Insufficient balance for the selected account and currency',
			invalidActionError: 'Invalid action',
		},
		edit: {
			successToast: 'Transaction edited successfully',
			transactionNotFound: 'Transaction not found',
			accountNotFound: 'Account not found',
			currencyNotFound: 'Currency not found',
			insufficientBalance:
				'Insufficient balance for the selected account and currency',
			invalidActionError: 'Invalid action',
		},
	},
}
