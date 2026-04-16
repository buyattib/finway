export default {
	index: {
		meta: {
			title: 'Credit Cards | Finway',
			description: 'Your credit cards',
		},
		title: 'Credit Cards',
		addCreditCardLabel: 'Credit Card',
		emptyTitle: 'You have not created any credit cards yet',
	},
	details: {
		meta: {
			title: 'Credit Card {{brand}} •••• {{last4}} | Finway',
		},
		loader: {
			notFoundError: 'Credit card not found',
		},
		editAriaLabel: 'Edit {{brand}} •••• {{last4}}',
		deleteAriaLabel: 'Delete credit card {{brand}} •••• {{last4}}',
		deleteTooltip: 'Deleting a credit card cannot be undone.',
		statementsTitle: 'Statements ({{total}})',
		addTransactionLabel: 'Transaction',
		emptyStatements: 'No statements yet.',
		closingDate: 'Closes',
		dueDate: 'Due',
		deleteTransactionAriaLabel: 'Delete transaction',
		action: {
			deleteCardSuccessToast:
				'Credit card {{brand}} •••• {{last4}} deleted',
			deleteTransactionErrorToast: 'Could not delete transaction',
			deleteTransactionErrorDescription: 'Please try again',
			deleteTransactionSuccessToast: 'Transaction deleted',
			transactionNotFoundToast: 'Transaction not found',
			unknownActionToast: 'Unknown action',
		},
	},
	statement: {
		details: {
			meta: {
				title: 'Statement · {{brand}} •••• {{last4}} | Finway',
			},
			loader: {
				notFoundError: 'Statement not found',
			},
			closingDate: 'Closing Date',
			dueDate: 'Due Date',
			editButton: 'Edit',
			editTitle: 'Edit Statement Dates',
			editDescription:
				'Update the closing and due dates for this statement.',
			editCancelButton: 'Cancel',
			editSubmitButton: 'Save',
			installmentsTitle: 'Installments ({{total}})',
			emptyInstallments: 'No installments in this statement.',
			installmentOf: '{{number}} / {{total}}',
			action: {
				notFoundError: 'Statement not found',
				editSuccessToast: 'Statement dates updated',
				closingDateAfterPrevious:
					'Closing date must be after the previous statement closing date',
				closingDateBeforeNext:
					'Closing date must be before the next statement closing date',
				dueDateAfterPrevious:
					'Due date must be after the previous statement due date',
				dueDateBeforeNext:
					'Due date must be before the next statement due date',
			},
		},
	},
	filters: {
		type: 'Filter by type',
		category: 'Filter by category',
	},
	form: {
		description: 'Add a credit card to track expenses associated with it.',
		brandLabel: 'Brand',
		brandPlaceholder: 'Visa, Mastercard, etc.',
		last4Label: 'Last 4 digits',
		last4Placeholder: '1234',
		expiryMonthLabel: 'Expiry Month',
		expiryMonthPlaceholder: 'MM',
		expiryYearLabel: 'Expiry Year',
		expiryYearPlaceholder: 'YYYY',
		institutionLabel: 'Institution',
		institutionPlaceholder: 'Bank, issuer, etc.',
		resetButton: 'Reset',
		schema: {
			brandRequired: 'Brand is required',
			last4Required: 'Last 4 digits are required',
			last4Invalid: 'Must be exactly 4 digits',
			expiryMonthRequired: 'Expiry month is required',
			expiryMonthInvalid: 'Must be a valid month',
			expiryMonthRange: 'Must be between 1 and 12',
			expiryYearRequired: 'Expiry year is required',
			expiryYearInvalid: 'Must be a 4-digit year',
			expiryYearFuture: 'Must be a valid year in the future',
			institutionRequired: 'Institution is required',
			currentClosingDateRequired: 'Closing date is required',
			currentDueDateRequired: 'Due date is required',
			dueDateMaxDifference:
				'Due date must be within 20 days of closing date',
		},
		create: {
			meta: {
				title: 'Create a credit card | Finway',
				description: 'Create a credit card to track your expenses',
			},
			title: 'Create a credit card',
			submitButton: 'Create',
			action: {
				invalidActionError: 'Invalid action',
				duplicateError: 'A credit card with this values already exists',
				successToast: 'Credit card created successfully',
			},
		},
		edit: {
			meta: {
				title: 'Edit Credit Card {{brand}} •••• {{last4}} | Finway',
			},
			title: 'Edit credit card',
			submitButton: 'Update',
			action: {
				invalidActionError: 'Invalid action',
				duplicateError: 'A credit card with this values already exists',
				successToast: 'Credit card updated successfully',
			},
		},
	},
	transaction: {
		create: {
			meta: {
				title: 'Create a credit card transaction | Finway',
				description: 'Create a credit card transaction',
			},
			loader: {
				notFoundError: 'Credit card not found',
			},
			title: 'Create a transaction',
			description:
				'Record a charge or refund on your {{brand}} •••• {{last4}} card.',
			transactionTypeLabel: 'Transaction Type',
			transactionTypePlaceholder: 'Select a transaction type',
			amountLabel: 'Amount',
			perInstallment: '{{amount}} per installment',
			installmentsLabel: 'Installments',
			installmentsPlaceholder: 'Select installments',
			currencyLabel: 'Currency',
			currencyPlaceholder: 'Select a currency',
			categoryLabel: 'Transaction Category',
			categoryPlaceholder: 'Select a transaction category',
			dateLabel: 'Date',
			descriptionLabel: 'Description (Optional)',
			resetButton: 'Reset',
			submitButton: 'Create',
			action: {
				invalidActionError: 'Invalid action',
				successToast: 'Transaction created successfully',
				currencyNotFound: 'Currency not found',
			},
			schema: {
				dateRequired: 'Date is required',
				transactionTypeRequired: 'Transaction type is required',
				amountRequired: 'Amount is required',
				amountInvalid: 'Amount must be a valid number',
				amountPositive: 'Amount must be greater than zero',
				installmentsMin: 'Must be at least 1',
				currencyRequired: 'Currency is required',
				categoryRequired: 'Category is required',
				creditCardRequired: 'Credit card is required',
			},
		},
		edit: {
			meta: {
				title: 'Edit transaction · {{brand}} •••• {{last4}} | Finway',
				description:
					'Edit a charge or refund on your {{brand}} •••• {{last4}} card.',
			},
			loader: {
				notFoundError: 'Transaction not found',
			},
			title: 'Edit transaction',
			description:
				'Edit a charge or refund on your {{brand}} •••• {{last4}} card.',
			submitButton: 'Update',
			action: {
				invalidActionError: 'Invalid action',
				successToast: 'Transaction updated successfully',
				transactionNotFound: 'Transaction not found',
				currencyNotFound: 'Currency not found',
			},
		},
		details: {
			meta: {
				title: 'Transaction · {{brand}} •••• {{last4}} | Finway',
			},
			loader: {
				notFoundError: 'Transaction not found',
			},
			editTransactionAriaLabel: 'Edit transaction',
			installmentsTitle: 'Installments ({{count}})',
			dueDate: 'Due Date',
			installmentAmount: 'Installment Amount',
		},
	},
}
