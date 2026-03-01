export default {
	index: {
		meta: {
			title: 'Transaction categories | Finway',
			description: 'Your Transaction categories',
		},
		title: 'Transaction Categories',
		addCategoryLabel: 'Category',
		emptyMessage:
			'You have not created any transaction category yet. Start creating them <0>here</0>.',
		deleteAriaLabel: 'Delete category {{name}}',
		deleteTooltip:
			'Deleting a category cannot be undone and transactions associated with it will be deleted.',
		action: {
			deleteErrorToast: 'Could not delete transaction category',
			deleteErrorToastDescription: 'Please try again',
			notFoundError: 'Transaction category {{transactionCategoryId}} not found',
			successToast: 'Transaction category deleted',
		},
		suggestions: {
			triggerButton: 'Suggested',
			title: 'Suggested Categories',
			description: 'Select categories to add them quickly.',
			addButton: 'Add Selected',
			categories: {
				housing: 'Housing',
				transportation: 'Transportation',
				foodAndGroceries: 'Food & Groceries',
				diningOut: 'Dining Out',
				utilities: 'Utilities',
				healthcare: 'Healthcare',
				entertainment: 'Entertainment',
				shopping: 'Shopping',
				clothing: 'Clothing',
				education: 'Education',
				savings: 'Savings',
				investments: 'Investments',
				travel: 'Travel',
				subscriptions: 'Subscriptions',
				insurance: 'Insurance',
				personalCare: 'Personal Care',
				fitness: 'Fitness',
				pets: 'Pets',
				donations: 'Donations',
				salary: 'Salary',
				freelance: 'Freelance',
				gifts: 'Gifts',
				other: 'Other',
			},
			successToast: 'Categories added successfully',
			noneSelectedError: 'Please select at least one category',
		},
	},
	form: {
		description:
			'Transaction categories are used to classify your expenses and incomes',
		nameLabel: 'Name',
		descriptionLabel: 'Description (Optional)',
		schema: {
			nameRequired: 'Name is required',
		},
		create: {
			meta: {
				title: 'Create Transaction Categories | Finway',
				description:
					'Create transaction categories to assign to your transactions',
			},
			action: {
				successToast: 'Transaction category created',
				duplicateError:
					'A transaction category with this name already exists',
			},
			title: 'Create a transaction category',
			submitButton: 'Create',
		},
	},
}
