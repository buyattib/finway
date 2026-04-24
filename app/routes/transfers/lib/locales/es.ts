import type en from './en'

export default {
	index: {
		action: {
			notFoundError: 'Transferencia {{transferId}} no encontrada',
			negativeBalanceError:
				'No se puede eliminar la transferencia porque la cuenta tendría un saldo negativo',
			successToast: 'Transferencia eliminada',
		},
	},
	form: {
		schema: {
			dateRequired: 'La fecha es requerida',
			amountRequired: 'El monto es requerido',
			amountInvalid: 'El monto debe ser un número válido',
			amountPositive: 'El monto debe ser mayor a cero',
			currencyRequired: 'La moneda es requerida',
			fromAccountRequired: 'La cuenta de origen es requerida',
			toAccountRequired: 'La cuenta de destino es requerida',
			sameAccountError:
				'Una transferencia solo puede realizarse entre cuentas diferentes',
		},
		create: {
			successToast: 'Transferencia creada exitosamente',
			fromAccountNotFound: 'Cuenta de origen no encontrada',
			toAccountNotFound: 'Cuenta de destino no encontrada',
			currencyNotFound: 'Moneda no encontrada',
			insufficientBalance:
				'Saldo insuficiente en la moneda seleccionada en la cuenta de origen',
		},
		edit: {
			successToast: 'Transferencia editada exitosamente',
			transferNotFound: 'Transferencia no encontrada',
			fromAccountNotFound: 'Cuenta de origen no encontrada',
			toAccountNotFound: 'Cuenta de destino no encontrada',
			currencyNotFound: 'Moneda no encontrada',
			insufficientBalance:
				'Saldo insuficiente para la cuenta y moneda seleccionadas',
			invalidActionError: 'Acción inválida',
		},
	},
} satisfies typeof en
