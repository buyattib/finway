export default {
	index: {
		meta: {
			title: 'Accounts | Finway',
			description: 'Your accounts',
		},
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
	details: {
		meta: {
			title: 'Account {{name}} | Finway',
			notFoundTitle: 'Account {{accountId}} not found | Finway',
			description: 'Account {{name}}',
		},
		loader: {
			notFoundError: 'Account not found',
		},
		action: {
			notFoundError: 'Account not found',
			successToast: 'Account {{name}} deleted',
			deleteErrorToast: 'Could not delete account',
			deleteErrorToastDescription: 'Please try again',
		},
		deleteAriaLabel: 'Delete account {{name}}',
		deleteTooltip:
			'Deleting an account cannot be undone and it deletes all transactions, transfers or exchanges associated with it.',
		currencyBalancesTitle: 'Currency balances',
		emptyBalances: "You don't have any activity in this account yet.",
	},
}
