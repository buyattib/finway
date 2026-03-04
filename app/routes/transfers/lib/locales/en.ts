export default {
	index: {
		meta: {
			title: 'Transfers | Finway',
			description: 'Your transfers between accounts',
		},
		title: 'Transfers',
		addTransferLabel: 'Transfer',
		emptyMessage:
			'You have not created any transfer yet. Start creating them <0>here</0>.',
		table: {
			date: 'Date',
			amount: 'Amount',
			fromAccount: 'From Account',
			toAccount: 'To Account',
		},
		deleteAriaLabel: 'Delete transfer',
		action: {
			deleteErrorToast: 'Could not delete transfer',
			deleteErrorToastDescription: 'Please try again',
			notFoundError: 'Transfer {{transferId}} not found',
			negativeBalanceError:
				'Cannot delete transfer as account would hold a negative balance',
			successToast: 'Transfer deleted',
		},
	},
	form: {
		description:
			'Transfers will affect your account balances and used to track your finances.',
		dateLabel: 'Date',
		fromAccountLabel: 'From Account',
		toAccountLabel: 'To Account',
		accountPlaceholder: 'Select an account',
		currencyLabel: 'Currency',
		currencyPlaceholder: 'Select a currency',
		amountLabel: 'Amount',
		resetButton: 'Reset',
		noAccountMessage:
			'You need to create an account first. Do it <0>here</0>',
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
			meta: {
				title: 'Create a transfer | Finway',
				description:
					'Create a transfer between accounts to track your money movements',
			},
			action: {
				successToast: 'Transfer created successfully',
				fromAccountNotFound: 'From account not found',
				toAccountNotFound: 'To account not found',
				currencyNotFound: 'Currency not found',
				insufficientBalance:
					'Insufficient balance in the selected currency on the from account',
			},
			title: 'Create a transfer',
			submitButton: 'Create',
		},
	},
}
