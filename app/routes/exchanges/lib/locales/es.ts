import type en from './en'

export default {
	index: {
		meta: {
			title: 'Intercambios | Finway',
			description: 'Tus intercambios de moneda',
		},
		title: 'Intercambios',
		addExchangeLabel: 'Intercambio',
		emptyMessage:
			'Aún no has creado ningún intercambio. Empieza a crearlos <0>aquí</0>.',
		table: {
			date: 'Fecha',
			account: 'Cuenta',
			from: 'Desde',
			to: 'Hacia',
			rate: 'Tasa',
		},
		deleteAriaLabel: 'Eliminar intercambio',
		action: {
			deleteErrorToast: 'No se pudo eliminar el intercambio',
			deleteErrorToastDescription: 'Por favor intenta de nuevo',
			notFoundError: 'Intercambio {{exchangeId}} no encontrado',
			negativeBalanceError:
				'No se puede eliminar el intercambio porque la cuenta tendría un saldo negativo',
			successToast: 'Intercambio eliminado',
		},
	},
	form: {
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
		resetButton: 'Restablecer',
		noAccountMessage:
			'Necesitas crear una cuenta primero. Hazlo <0>aquí</0>',
		schema: {
			dateRequired: 'La fecha es requerida',
			amountRequired: 'El monto es requerido',
			amountInvalid: 'El monto debe ser un número válido',
			amountPositive: 'El monto debe ser mayor a cero',
			fromCurrencyRequired: 'La moneda de origen es requerida',
			toCurrencyRequired: 'La moneda de destino es requerida',
			accountRequired: 'La cuenta es requerida',
			sameCurrencyError:
				'Un intercambio solo puede realizarse entre monedas diferentes',
		},
		create: {
			meta: {
				title: 'Crear un intercambio | Finway',
				description:
					'Crea un intercambio de moneda para rastrear tu dinero',
			},
			action: {
				successToast: 'Intercambio creado exitosamente',
				accountNotFound: 'Cuenta no encontrada',
				fromCurrencyNotFound: 'Moneda de origen no encontrada',
				toCurrencyNotFound: 'Moneda de destino no encontrada',
				insufficientBalance:
					'Saldo insuficiente en la moneda de origen seleccionada',
			},
			title: 'Crear un intercambio',
			submitButton: 'Crear',
		},
	},
} satisfies typeof en
