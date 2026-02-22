export default {
	index: {
		title: 'Accounts',
		addAccountLabel: 'Account',
		searchPlaceholder: 'Search accounts by name',
		emptyMessage:
			'You have not created any accounts yet. Start creating them <0>here</0>.',
		emptySearchMessage: 'No accounts found for the search {{search}}',
		editAction: 'Edit',
		transactionAction: 'Transaction',
	},
	form: {
		description: 'Accounts represent your real world accounts where your money is.',
		nameLabel: 'Name',
		descriptionLabel: 'Description (Optional)',
		accountTypeLabel: 'Account Type',
		accountTypePlaceholder: 'Select an option',
		resetButton: 'Reset',
		create: {
			title: 'Create an account',
			submitButton: 'Create',
			successToast: 'Account created successfully',
			duplicateError: 'An account with this name and type already exists',
		},
		edit: {
			title: 'Edit account',
			submitButton: 'Update',
			successToast: 'Account updated successfully',
			notFoundError: 'Account not found',
			accountWithIdNotFoundError: 'Account with id {{id}} not found',
			duplicateError: 'An account with this name and type already exists',
		},
	},
	details: {
		deleteAriaLabel: 'Delete account {{name}}',
		deleteTooltip: 'Deleting an account cannot be undone and it deletes all transactions, transfers or exchanges associated with it.',
		currencyBalancesTitle: 'Currency balances',
		emptyBalances: 'You don\'t have any activity in this account yet.',
		notFoundError: 'Account not found',
		successToast: 'Account {{name}} deleted',
		deleteErrorToast: 'Could not delete account',
		deleteErrorToastDescription: 'Please try again',
	},
}
