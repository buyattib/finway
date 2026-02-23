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
