import type en from './en'

export default {
	index: {
		action: {
			notFoundError: 'Transacción {{transactionId}} no encontrada',
			negativeBalanceError:
				'No se puede eliminar la transacción porque la cuenta tendría un saldo negativo',
			successToast: 'Transacción eliminada',
		},
	},
	form: {
		schema: {
			dateRequired: 'La fecha es requerida',
			dateFuture: 'La fecha no puede ser futura',
			transactionTypeRequired: 'El tipo de transacción es requerido',
			amountRequired: 'El monto es requerido',
			amountInvalid: 'El monto debe ser un número válido',
			amountPositive: 'El monto debe ser mayor a cero',
			accountRequired: 'La cuenta es requerida',
			currencyRequired: 'La moneda es requerida',
			categoryRequired: 'La categoría es requerida',
			categoryInvalidForType:
				'La categoría no es válida para el tipo de transacción seleccionado',
		},
		create: {
			successToast: 'Transacción creada exitosamente',
			accountNotFound: 'Cuenta no encontrada',
			currencyNotFound: 'Moneda no encontrada',
			insufficientBalance:
				'Saldo insuficiente para la cuenta y moneda seleccionadas',
			invalidActionError: 'Acción inválida',
		},
		edit: {
			successToast: 'Transacción editada exitosamente',
			transactionNotFound: 'Transacción no encontrada',
			accountNotFound: 'Cuenta no encontrada',
			currencyNotFound: 'Moneda no encontrada',
			insufficientBalance:
				'Saldo insuficiente para la cuenta y moneda seleccionadas',
			invalidActionError: 'Acción inválida',
		},
	},
} satisfies typeof en
