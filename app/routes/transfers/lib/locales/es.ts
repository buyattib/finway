import type en from './en'

export default {
	index: {
		meta: {
			title: 'Transferencias | Finway',
			description: 'Tus transferencias entre cuentas',
		},
		title: 'Transferencias',
		addTransferLabel: 'Transferencia',
		emptyMessage:
			'Aún no has creado ninguna transferencia. Empieza a crearlas <0>aquí</0>.',
		table: {
			date: 'Fecha',
			amount: 'Monto',
			fromAccount: 'Cuenta de origen',
			toAccount: 'Cuenta de destino',
		},
		deleteAriaLabel: 'Eliminar transferencia',
		action: {
			deleteErrorToast: 'No se pudo eliminar la transferencia',
			deleteErrorToastDescription: 'Por favor intenta de nuevo',
			notFoundError: 'Transferencia {{transferId}} no encontrada',
			negativeBalanceError:
				'No se puede eliminar la transferencia porque la cuenta tendría un saldo negativo',
			successToast: 'Transferencia eliminada',
		},
	},
	form: {
		description:
			'Las transferencias afectarán los saldos de tus cuentas y se usarán para rastrear tus finanzas.',
		dateLabel: 'Fecha',
		fromAccountLabel: 'Cuenta de origen',
		toAccountLabel: 'Cuenta de destino',
		accountPlaceholder: 'Selecciona una cuenta',
		currencyLabel: 'Moneda',
		currencyPlaceholder: 'Selecciona una moneda',
		amountLabel: 'Monto',
		resetButton: 'Restablecer',
		noAccountMessage:
			'Necesitas crear una cuenta primero. Hazlo <0>aquí</0>',
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
			meta: {
				title: 'Crear una transferencia | Finway',
				description:
					'Crea una transferencia entre cuentas para rastrear tus movimientos de dinero',
			},
			action: {
				successToast: 'Transferencia creada exitosamente',
				fromAccountNotFound: 'Cuenta de origen no encontrada',
				toAccountNotFound: 'Cuenta de destino no encontrada',
				currencyNotFound: 'Moneda no encontrada',
				insufficientBalance:
					'Saldo insuficiente en la moneda seleccionada en la cuenta de origen',
			},
			title: 'Crear una transferencia',
			submitButton: 'Crear',
		},
	},
} satisfies typeof en
