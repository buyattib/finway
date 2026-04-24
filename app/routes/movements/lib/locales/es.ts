import type en from './en'

export default {
	index: {
		meta: {
			title: 'Movimientos | Finway',
			description: 'Tus transacciones, transferencias e intercambios',
		},
		title: 'Movimientos',
		createLabel: 'Crear',
		tabs: {
			transactions: 'Transacciones',
			transfers: 'Transferencias',
			exchanges: 'Intercambios',
		},
		transactions: {
			emptyTitle: 'Aún no has creado ninguna transacción',
			emptyFilteredMessage:
				'No se encontraron transacciones con los filtros aplicados',
			editAriaLabel: 'Editar transacción',
			deleteAriaLabel: 'Eliminar transacción',
			table: {
				date: 'Fecha',
				account: 'Cuenta',
				category: 'Categoría',
				type: 'Tipo',
				amount: 'Monto',
				actions: 'Acciones',
			},
			filters: {
				account: 'Filtrar por cuenta',
				currency: 'Filtrar por moneda',
				category: 'Filtrar por categoría',
				type: 'Filtrar por tipo',
			},
		},
		transfers: {
			emptyTitle: 'Aún no has creado ninguna transferencia',
			emptyFilteredMessage:
				'No se encontraron transferencias con los filtros aplicados',
			editAriaLabel: 'Editar transferencia',
			deleteAriaLabel: 'Eliminar transferencia',
			table: {
				date: 'Fecha',
				amount: 'Monto',
				fromAccount: 'Cuenta de origen',
				toAccount: 'Cuenta de destino',
				actions: 'Acciones',
			},
			filters: {
				fromAccount: 'Filtrar por cuenta de origen',
				toAccount: 'Filtrar por cuenta de destino',
				currency: 'Filtrar por moneda',
			},
		},
		exchanges: {
			emptyTitle: 'Aún no has creado ningún intercambio',
			emptyFilteredMessage:
				'No se encontraron intercambios con los filtros aplicados',
			editAriaLabel: 'Editar intercambio',
			deleteAriaLabel: 'Eliminar intercambio',
			table: {
				date: 'Fecha',
				account: 'Cuenta',
				from: 'Desde',
				to: 'Hacia',
				rate: 'Tasa',
				actions: 'Acciones',
			},
			filters: {
				account: 'Filtrar por cuenta',
				fromCurrency: 'Filtrar por moneda de origen',
				toCurrency: 'Filtrar por moneda de destino',
			},
		},
	},
	dialog: {
		title: 'Nuevo movimiento',
		description: 'Elegí el tipo de movimiento que querés registrar.',
		entityLabel: 'Tipo de movimiento',
		entityPlaceholder: 'Seleccioná un tipo de movimiento',
		entities: {
			transaction: 'Transacción',
			transfer: 'Transferencia',
			exchange: 'Intercambio',
		},
	},
	form: {
		common: {
			resetButton: 'Restablecer',
			createSubmitButton: 'Crear',
			editSubmitButton: 'Actualizar',
			availableBalance: 'Disponible: {{symbol}}{{amount}} {{currency}}',
			noAccountMessage:
				'Necesitas crear una cuenta primero. Hazlo <0>aquí</0>',
		},
		transaction: {
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
			noCategoryMessage:
				'Necesitas crear una categoría de transacción primero. Hazlo <0>aquí</0>',
		},
		transfer: {
			description:
				'Las transferencias afectarán los saldos de tus cuentas y se usarán para rastrear tus finanzas.',
			dateLabel: 'Fecha',
			fromAccountLabel: 'Cuenta de origen',
			toAccountLabel: 'Cuenta de destino',
			accountPlaceholder: 'Selecciona una cuenta',
			currencyLabel: 'Moneda',
			currencyPlaceholder: 'Selecciona una moneda',
			amountLabel: 'Monto',
		},
		exchange: {
			description:
				'Los intercambios afectarán los saldos de tu cuenta y se usarán para rastrear tus finanzas.',
			dateLabel: 'Fecha',
			accountLabel: 'Cuenta',
			accountPlaceholder: 'Selecciona una cuenta',
			fromCurrencyLabel: 'Moneda de origen',
			toCurrencyLabel: 'Moneda de destino',
			currencyPlaceholder: 'Selecciona una moneda',
			fromAmountLabel: 'Monto de origen',
			toAmountLabel: 'Monto de destino',
		},
	},
} satisfies typeof en
