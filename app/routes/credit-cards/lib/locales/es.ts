import type en from './en'

export default {
	index: {
		meta: {
			title: 'Tarjetas de Crédito | Finway',
			description: 'Tus tarjetas de crédito',
		},
		title: 'Tarjetas de Crédito',
		addCreditCardLabel: 'Tarjeta de Crédito',
		emptyMessage:
			'Aún no has creado ninguna tarjeta de crédito. Empieza a crearlas <0>aquí</0>',
		expires: 'Vence {{month}}/{{year}}',
	},
	details: {
		meta: {
			title: 'Tarjeta de Crédito {{brand}} •••• {{last4}} | Finway',
			notFoundTitle:
				'Tarjeta de crédito {{creditCardId}} no encontrada | Finway',
		},
		loader: {
			notFoundError: 'Tarjeta de crédito no encontrada',
		},
		editAriaLabel: 'Editar {{brand}} •••• {{last4}}',
		deleteAriaLabel: 'Eliminar tarjeta de crédito {{brand}} •••• {{last4}}',
		deleteTooltip: 'Eliminar una tarjeta de crédito no se puede deshacer.',
		transactionsTitle: 'Transacciones ({{total}})',
		addTransactionLabel: 'Transacción',
		emptyMessage: 'Aún no hay transacciones. <0>Crear una</0>',
		table: {
			date: 'Fecha',
			category: 'Categoría',
			type: 'Tipo',
			amount: 'Monto',
			installments: 'Cuotas',
		},
		deleteTransactionAriaLabel: 'Eliminar transacción',
		action: {
			notFoundError: 'Tarjeta de crédito no encontrada',
			deleteCardErrorToast: 'No se pudo eliminar la tarjeta de crédito',
			deleteCardErrorDescription: 'Por favor intenta de nuevo',
			deleteCardSuccessToast:
				'Tarjeta de crédito {{brand}} •••• {{last4}} eliminada',
			deleteTransactionErrorToast: 'No se pudo eliminar la transacción',
			deleteTransactionErrorDescription: 'Por favor intenta de nuevo',
			deleteTransactionSuccessToast: 'Transacción eliminada',
			transactionNotFoundToast: 'Transacción no encontrada',
			unknownActionToast: 'Acción desconocida',
		},
	},
	header: {
		expires: 'Vence {{month}}/{{year}}',
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
		accountLabel: 'Cuenta',
		accountPlaceholder: 'Selecciona una cuenta',
		currencyLabel: 'Moneda',
		currencyPlaceholder: 'Selecciona una moneda',
		resetButton: 'Restablecer',
		noAccountMessage:
			'Necesitas crear una cuenta primero. Hazlo <0>aquí</0>',
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
			accountRequired: 'La cuenta es requerida',
			currencyRequired: 'La moneda es requerida',
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
				successToast: 'Tarjeta de crédito creada exitosamente',
				accountNotFound: 'Cuenta no encontrada',
				currencyNotFound: 'Moneda no encontrada',
			},
		},
		edit: {
			meta: {
				title: 'Editar Tarjeta de Crédito {{brand}} •••• {{last4}} | Finway',
				notFoundTitle:
					'Tarjeta de crédito {{creditCardId}} no encontrada | Finway',
			},
			title: 'Editar tarjeta de crédito',
			submitButton: 'Actualizar',
			loader: {
				notFoundError: 'Tarjeta de crédito no encontrada',
			},
			action: {
				invalidActionError: 'Acción inválida',
				successToast: 'Tarjeta de crédito actualizada exitosamente',
				creditCardNotFound: 'Tarjeta de crédito no encontrada',
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
			categoryLabel: 'Categoría de Transacción',
			categoryPlaceholder: 'Selecciona una categoría de transacción',
			dateLabel: 'Fecha',
			firstInstallmentDateLabel: 'Fecha de Primera Cuota',
			chargeDateLabel: 'Fecha de Cargo',
			descriptionLabel: 'Descripción (Opcional)',
			resetButton: 'Restablecer',
			submitButton: 'Crear',
			action: {
				invalidActionError: 'Acción inválida',
				successToast: 'Transacción creada exitosamente',
				creditCardNotFound: 'Tarjeta de crédito no encontrada',
				categoryNotFound: 'Categoría de transacción no encontrada',
			},
			schema: {
				dateRequired: 'La fecha es requerida',
				transactionTypeRequired: 'El tipo de transacción es requerido',
				amountRequired: 'El monto es requerido',
				amountInvalid: 'El monto debe ser un número válido',
				amountPositive: 'El monto debe ser mayor a cero',
				installmentsMin: 'Debe ser al menos 1',
				categoryRequired: 'La categoría es requerida',
				creditCardRequired: 'La tarjeta de crédito es requerida',
			},
		},
		details: {
			meta: {
				title: 'Transacción · {{brand}} •••• {{last4}} | Finway',
				notFoundTitle: 'Transacción no encontrada | Finway',
			},
			loader: {
				creditCardNotFoundError: 'Tarjeta de crédito no encontrada',
				notFoundError: 'Transacción no encontrada',
			},
			backAriaLabel: 'Volver a la tarjeta de crédito',
			date: 'Fecha',
			type: 'Tipo',
			amount: 'Monto',
			category: 'Categoría',
			description: 'Descripción',
			installmentsTitle: 'Cuotas ({{count}})',
			dueDate: 'Fecha de Vencimiento',
			installmentAmount: 'Monto de Cuota',
		},
	},
} satisfies typeof en
