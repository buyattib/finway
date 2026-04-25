export default {
	index: {
		meta: {
			title: 'Accounts | Finway',
			description: 'Your accounts',
		},
		title: 'Accounts',
		addAccountLabel: 'Account',
		searchPlaceholder: 'Search accounts by name',
		emptyTitle: 'You have not created any accounts yet',
		emptySearchMessage: 'No accounts found for the search {{search}}',
		noBalances: 'No balances yet',
		editAction: 'Edit',
		transactionAction: 'Transaction',
		deleteAction: 'Delete',
		deleteConfirm: {
			title: 'Delete account "{{name}}"?',
			description:
				'This cannot be undone and will also delete all transactions, transfers and exchanges associated with it.',
			cancel: 'Cancel',
			confirm: 'Delete',
		},
	},
	form: {
		description:
			'Accounts represent your real world accounts where your money is.',
		nameLabel: 'Name',
		descriptionLabel: 'Description (Optional)',
		accountTypeLabel: 'Account Type',
		accountTypePlaceholder: 'Select an option',
		resetButton: 'Reset',
		schema: {
			nameRequired: 'Name is required',
			accountTypeRequired: 'Account type is required',
		},
		create: {
			meta: {
				title: 'Create an Account | Finway',
				description: 'Create an account to track your transactions',
			},
			action: {
				successToast: 'Account created successfully',
				duplicateError:
					'An account with this name and type already exists',
				invalidActionError: 'Invalid action',
			},
			title: 'Create an account',
			submitButton: 'Create',
		},
		edit: {
			meta: {
				title: 'Edit Account {{name}} | Finway',
				notFoundTitle: 'Account {{accountId}} not found | Finway',
				description: 'Edit account {{name}}',
			},
			loader: {
				notFoundError: 'Account not found',
			},
			action: {
				successToast: 'Account updated successfully',
				accountWithIdNotFoundError: 'Account with id {{id}} not found',
				duplicateError:
					'An account with this name and type already exists',
				invalidActionError: 'Invalid action',
			},
			title: 'Edit account',
			submitButton: 'Update',
		},
	},
	delete: {
		action: {
			notFoundError: 'Account not found',
			successToast: 'Account {{name}} deleted',
			errorToast: 'Could not delete account',
			errorToastDescription: 'Please try again',
		},
	},
}
