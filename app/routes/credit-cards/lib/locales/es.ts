import type en from './en'

export default {
	index: {
		meta: {
			title: 'Tarjetas de Crédito | Finway',
			description: 'Tus tarjetas de crédito',
		},
		title: 'Tarjetas de Crédito',
		addCreditCardLabel: 'Tarjeta de Crédito',
		emptyTitle: 'Aún no has creado ninguna tarjeta de crédito',
	},
	details: {
		meta: {
			title: 'Tarjeta de Crédito {{brand}} •••• {{last4}} | Finway',
		},
		loader: {
			notFoundError: 'Tarjeta de crédito no encontrada',
		},
		editAriaLabel: 'Editar {{brand}} •••• {{last4}}',
		deleteAriaLabel: 'Eliminar tarjeta de crédito {{brand}} •••• {{last4}}',
		deleteTooltip: 'Eliminar una tarjeta de crédito no se puede deshacer.',
		statementsTitle: 'Resúmenes ({{total}})',
		addTransactionLabel: 'Transacción',
		emptyStatements: 'Aún no hay resúmenes.',
		closingDate: 'Cierre',
		dueDate: 'Vencimiento',
		deleteTransactionAriaLabel: 'Eliminar transacción',
		action: {
			deleteCardSuccessToast:
				'Tarjeta de crédito {{brand}} •••• {{last4}} eliminada',
			deleteTransactionErrorToast: 'No se pudo eliminar la transacción',
			deleteTransactionErrorDescription: 'Por favor intenta de nuevo',
			deleteTransactionSuccessToast: 'Transacción eliminada',
			transactionNotFoundToast: 'Transacción no encontrada',
			unknownActionToast: 'Acción desconocida',
		},
	},
	statement: {
		details: {
			meta: {
				title: 'Resumen · {{brand}} •••• {{last4}} | Finway',
			},
			loader: {
				notFoundError: 'Resumen no encontrado',
			},
			closingDate: 'Fecha de Cierre',
			dueDate: 'Fecha de Vencimiento',
			editButton: 'Editar',
			editTitle: 'Editar Fechas del Resumen',
			editDescription:
				'Actualiza las fechas de cierre y vencimiento de este resumen.',
			editCancelButton: 'Cancelar',
			editSubmitButton: 'Guardar',
			installmentsTitle: 'Cuotas ({{total}})',
			emptyInstallments: 'No hay cuotas en este resumen.',
			installmentOf: '{{number}} / {{total}}',
			action: {
				notFoundError: 'Resumen no encontrado',
				editSuccessToast: 'Fechas del resumen actualizadas',
				closingDateAfterPrevious:
					'La fecha de cierre debe ser posterior a la del resumen anterior',
				closingDateBeforeNext:
					'La fecha de cierre debe ser anterior a la del resumen siguiente',
			},
		},
	},
	filters: {
		type: 'Filtrar por tipo',
		category: 'Filtrar por categoría',
	},
	form: {
		description:
			'Agrega una tarjeta de crédito para rastrear los gastos asociados.',
		brandLabel: 'Marca',
		brandPlaceholder: 'Visa, Mastercard, etc.',
		last4Label: 'Últimos 4 dígitos',
		last4Placeholder: '1234',
		expiryMonthLabel: 'Mes de Vencimiento',
		expiryMonthPlaceholder: 'MM',
		expiryYearLabel: 'Año de Vencimiento',
		expiryYearPlaceholder: 'AAAA',
		institutionLabel: 'Institución',
		institutionPlaceholder: 'Banco, emisor, etc.',
		resetButton: 'Restablecer',
		schema: {
			brandRequired: 'La marca es requerida',
			last4Required: 'Los últimos 4 dígitos son requeridos',
			last4Invalid: 'Deben ser exactamente 4 dígitos',
			expiryMonthRequired: 'El mes de vencimiento es requerido',
			expiryMonthInvalid: 'Debe ser un mes válido',
			expiryMonthRange: 'Debe ser entre 1 y 12',
			expiryYearRequired: 'El año de vencimiento es requerido',
			expiryYearInvalid: 'Debe ser un año de 4 dígitos',
			expiryYearFuture: 'Debe ser un año válido en el futuro',
			institutionRequired: 'La institución es requerida',
			currentClosingDateRequired: 'La fecha de cierre es requerida',
			currentDueDateRequired: 'La fecha de vencimiento es requerida',
			dueDateMaxDifference:
				'La fecha de vencimiento debe estar dentro de los 20 días de la fecha de cierre',
		},
		create: {
			meta: {
				title: 'Crear una tarjeta de crédito | Finway',
				description:
					'Crea una tarjeta de crédito para rastrear tus gastos',
			},
			title: 'Crear una tarjeta de crédito',
			submitButton: 'Crear',
			action: {
				invalidActionError: 'Acción inválida',
				duplicateError:
					'Una tarjéta de crédito con estos valores ya existe',
				successToast: 'Tarjeta de crédito creada exitosamente',
			},
		},
		edit: {
			meta: {
				title: 'Editar Tarjeta de Crédito {{brand}} •••• {{last4}} | Finway',
			},
			title: 'Editar tarjeta de crédito',
			submitButton: 'Actualizar',
			action: {
				invalidActionError: 'Acción inválida',
				duplicateError:
					'Una tarjéta de crédito con estos valores ya existe',
				successToast: 'Tarjeta de crédito actualizada exitosamente',
			},
		},
	},
	transaction: {
		create: {
			meta: {
				title: 'Crear una transacción de tarjeta de crédito | Finway',
				description: 'Crear una transacción de tarjeta de crédito',
			},
			loader: {
				notFoundError: 'Tarjeta de crédito no encontrada',
			},
			title: 'Crear una transacción',
			description:
				'Registra un cargo o reembolso en tu tarjeta {{brand}} •••• {{last4}}.',
			transactionTypeLabel: 'Tipo de Transacción',
			transactionTypePlaceholder: 'Selecciona un tipo de transacción',
			amountLabel: 'Monto',
			perInstallment: '{{amount}} por cuota',
			installmentsLabel: 'Cuotas',
			installmentsPlaceholder: 'Selecciona cuotas',
			currencyLabel: 'Moneda',
			currencyPlaceholder: 'Selecciona una moneda',
			categoryLabel: 'Categoría de Transacción',
			categoryPlaceholder: 'Selecciona una categoría de transacción',
			dateLabel: 'Fecha',
			descriptionLabel: 'Descripción (Opcional)',
			resetButton: 'Restablecer',
			submitButton: 'Crear',
			action: {
				invalidActionError: 'Acción inválida',
				successToast: 'Transacción creada exitosamente',
				currencyNotFound: 'Moneda no encontrada',
			},
			schema: {
				dateRequired: 'La fecha es requerida',
				transactionTypeRequired: 'El tipo de transacción es requerido',
				amountRequired: 'El monto es requerido',
				amountInvalid: 'El monto debe ser un número válido',
				amountPositive: 'El monto debe ser mayor a cero',
				installmentsMin: 'Debe ser al menos 1',
				currencyRequired: 'La moneda es requerida',
				categoryRequired: 'La categoría es requerida',
				creditCardRequired: 'La tarjeta de crédito es requerida',
			},
		},
		edit: {
			meta: {
				title: 'Editar transacción · {{brand}} •••• {{last4}} | Finway',
				description:
					'Edita un cargo o reembolso en tu tarjeta {{brand}} •••• {{last4}}.',
			},
			loader: {
				notFoundError: 'Transacción no encontrada',
			},
			title: 'Editar transacción',
			description:
				'Edita un cargo o reembolso en tu tarjeta {{brand}} •••• {{last4}}.',
			submitButton: 'Actualizar',
			action: {
				invalidActionError: 'Acción inválida',
				successToast: 'Transacción actualizada exitosamente',
				transactionNotFound: 'Transacción no encontrada',
				currencyNotFound: 'Moneda no encontrada',
			},
		},
		details: {
			meta: {
				title: 'Transacción · {{brand}} •••• {{last4}} | Finway',
			},
			loader: {
				notFoundError: 'Transacción no encontrada',
			},
			editTransactionAriaLabel: 'Editar transacción',
			installmentsTitle: 'Cuotas ({{count}})',
			dueDate: 'Fecha de Vencimiento',
			installmentAmount: 'Monto de Cuota',
		},
	},
} satisfies typeof en
