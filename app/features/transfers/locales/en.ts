export default {
	index: {
		action: {
			notFoundError: 'Transfer {{transferId}} not found',
			negativeBalanceError:
				'Cannot delete transfer as account would hold a negative balance',
			successToast: 'Transfer deleted',
		},
	},
	form: {
		schema: {
			dateRequired: 'Date is required',
			amountRequired: 'Amount is required',
			amountInvalid: 'Amount must be a valid number',
			amountPositive: 'Amount must be greater than zero',
			currencyRequired: 'Currency is required',
			fromAccountRequired: 'From Account is required',
			toAccountRequired: 'To Account is required',
			sameAccountError:
				'A transfer can only be done between different accounts',
		},
		create: {
			successToast: 'Transfer created successfully',
			fromAccountNotFound: 'From account not found',
			toAccountNotFound: 'To account not found',
			currencyNotFound: 'Currency not found',
			insufficientBalance:
				'Insufficient balance in the selected currency on the from account',
		},
		edit: {
			successToast: 'Transfer edited successfully',
			transferNotFound: 'Transfer not found',
			fromAccountNotFound: 'From account not found',
			toAccountNotFound: 'To account not found',
			currencyNotFound: 'Currency not found',
			insufficientBalance:
				'Insufficient balance for the selected account and currency',
			invalidActionError: 'Invalid action',
		},
	},
}
