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
	create: {
		transactions: {
			action: {
				successToast: 'Transacción creada exitosamente',
				accountNotFound: 'Cuenta no encontrada',
				currencyNotFound: 'Moneda no encontrada',
				insufficientBalance:
					'Saldo insuficiente para la cuenta y moneda seleccionadas',
				invalidActionError: 'Acción inválida',
			},
		},
		transfers: {
			action: {
				successToast: 'Transferencia creada exitosamente',
				fromAccountNotFound: 'Cuenta de origen no encontrada',
				toAccountNotFound: 'Cuenta de destino no encontrada',
				currencyNotFound: 'Moneda no encontrada',
				insufficientBalance:
					'Saldo insuficiente en la moneda seleccionada en la cuenta de origen',
			},
		},
		exchanges: {
			action: {
				successToast: 'Intercambio creado exitosamente',
				accountNotFound: 'Cuenta no encontrada',
				fromCurrencyNotFound: 'Moneda de origen no encontrada',
				toCurrencyNotFound: 'Moneda de destino no encontrada',
				insufficientBalance:
					'Saldo insuficiente en la moneda de origen seleccionada',
			},
		},
	},
} satisfies typeof en
