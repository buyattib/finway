import type en from './en'

export default {
	index: {
		action: {
			notFoundError: 'Intercambio {{exchangeId}} no encontrado',
			negativeBalanceError:
				'No se puede eliminar el intercambio porque la cuenta tendría un saldo negativo',
			successToast: 'Intercambio eliminado',
		},
	},
	form: {
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
			successToast: 'Intercambio creado exitosamente',
			accountNotFound: 'Cuenta no encontrada',
			fromCurrencyNotFound: 'Moneda de origen no encontrada',
			toCurrencyNotFound: 'Moneda de destino no encontrada',
			insufficientBalance:
				'Saldo insuficiente en la moneda de origen seleccionada',
		},
		edit: {
			successToast: 'Intercambio editado exitosamente',
			exchangeNotFound: 'Intercambio no encontrado',
			accountNotFound: 'Cuenta no encontrada',
			fromCurrencyNotFound: 'Moneda de origen no encontrada',
			toCurrencyNotFound: 'Moneda de destino no encontrada',
			insufficientBalance:
				'Saldo insuficiente en la moneda de origen seleccionada',
			invalidActionError: 'Acción inválida',
		},
	},
} satisfies typeof en
