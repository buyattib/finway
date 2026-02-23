import type en from './en'

export default {
	index: {
		meta: {
			title: 'Transacciones | Finway',
			description: 'Tus transacciones',
		},
		title: 'Transacciones ({{total}})',
		addTransactionLabel: 'Transacción',
		emptyMessage:
			'Aún no has creado ninguna transacción. Empieza a crearlas <0>aquí</0>.',
		emptyFilteredMessage:
			'No se encontraron transacciones con los filtros aplicados',
		table: {
			date: 'Fecha',
			account: 'Cuenta',
			category: 'Categoría',
			type: 'Tipo',
			amount: 'Monto',
		},
		editAriaLabel: 'Editar transacción',
		deleteAriaLabel: 'Eliminar transacción',
		action: {
			deleteErrorToast: 'No se pudo eliminar la transacción',
			deleteErrorToastDescription: 'Por favor intenta de nuevo',
			notFoundError: 'Transacción {{transactionId}} no encontrada',
			negativeBalanceError:
				'No se puede eliminar la transacción porque la cuenta tendría un saldo negativo',
			successToast: 'Transacción eliminada',
		},
	},
	filters: {
		account: 'Filtrar por cuenta',
		currency: 'Filtrar por moneda',
		category: 'Filtrar por categoría',
		type: 'Filtrar por tipo',
	},
	form: {
		description:
			'Los ingresos y gastos afectarán los saldos de tus cuentas y se usan para rastrear tus finanzas.',
		transactionTypeLabel: 'Tipo de Transacción',
		transactionTypePlaceholder: 'Selecciona un tipo de transacción',
		accountLabel: 'Cuenta',
		accountPlaceholder: 'Selecciona una cuenta',
		currencyLabel: 'Moneda',
		currencyPlaceholder: 'Selecciona una moneda',
		amountLabel: 'Monto',
		categoryLabel: 'Categoría de Transacción',
		categoryPlaceholder: 'Selecciona una categoría de transacción',
		dateLabel: 'Fecha',
		descriptionLabel: 'Descripción (Opcional)',
		resetButton: 'Restablecer',
		noAccountMessage:
			'Necesitas crear una cuenta primero. Hazlo <0>aquí</0>',
		noCategoryMessage:
			'Necesitas crear una categoría de transacción primero. Hazlo <0>aquí</0>',
		schema: {
			dateRequired: 'La fecha es requerida',
			transactionTypeRequired: 'El tipo de transacción es requerido',
			amountRequired: 'El monto es requerido',
			amountInvalid: 'El monto debe ser un número válido',
			amountPositive: 'El monto debe ser mayor a cero',
			accountRequired: 'La cuenta es requerida',
			currencyRequired: 'La moneda es requerida',
			categoryRequired: 'La categoría es requerida',
		},
		create: {
			meta: {
				title: 'Crear una transacción | Finway',
				description:
					'Crea una transacción para rastrear tus ingresos y gastos',
			},
			action: {
				successToast: 'Transacción creada exitosamente',
				accountNotFound: 'Cuenta no encontrada',
				currencyNotFound: 'Moneda no encontrada',
				categoryNotFound: 'Categoría de transacción no encontrada',
				insufficientBalance:
					'Saldo insuficiente para la cuenta y moneda seleccionadas',
			},
			title: 'Crear una transacción',
			submitButton: 'Crear',
		},
		edit: {
			meta: {
				title: 'Editar transacción {{transactionId}} | Finway',
				description: 'Editar transacción {{transactionId}} | Finway',
			},
			action: {
				successToast: 'Transacción editada exitosamente',
				transactionNotFound: 'Transacción no encontrada',
				accountNotFound: 'Cuenta no encontrada',
				currencyNotFound: 'Moneda no encontrada',
				categoryNotFound: 'Categoría de transacción no encontrada',
				insufficientBalance:
					'Saldo insuficiente para la cuenta y moneda seleccionadas',
			},
			title: 'Editar transacción',
			submitButton: 'Actualizar',
		},
	},
} satisfies typeof en
