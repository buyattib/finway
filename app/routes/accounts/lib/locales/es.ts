import type en from './en'

export default {
	index: {
		meta: {
			title: 'Cuentas | Finway',
			description: 'Tus cuentas',
		},
		title: 'Cuentas',
		addAccountLabel: 'Cuenta',
		searchPlaceholder: 'Buscar cuentas por nombre',
		emptyMessage:
			'Aún no has creado ninguna cuenta. Empieza a crearlas <0>aquí</0>.',
		emptySearchMessage: 'No se encontraron cuentas para la búsqueda {{search}}',
		editAction: 'Editar',
		transactionAction: 'Transacción',
	},
	form: {
		description: 'Las cuentas representan tus cuentas del mundo real donde está tu dinero.',
		nameLabel: 'Nombre',
		descriptionLabel: 'Descripción (Opcional)',
		accountTypeLabel: 'Tipo de cuenta',
		accountTypePlaceholder: 'Selecciona una opción',
		resetButton: 'Restablecer',
		schema: {
			nameRequired: 'El nombre es requerido',
			accountTypeRequired: 'El tipo de cuenta es requerido',
		},
		create: {
			meta: {
				title: 'Crear una Cuenta | Finway',
				description: 'Crea una cuenta para rastrear tus transacciones',
			},
			action: {
				successToast: 'Cuenta creada exitosamente',
				duplicateError: 'Ya existe una cuenta con este nombre y tipo',
			},
			title: 'Crear una cuenta',
			submitButton: 'Crear',
		},
		edit: {
			meta: {
				title: 'Editar Cuenta {{name}} | Finway',
				notFoundTitle: 'Cuenta {{accountId}} no encontrada | Finway',
				description: 'Editar cuenta {{name}}',
			},
			loader: {
				notFoundError: 'Cuenta no encontrada',
			},
			action: {
				successToast: 'Cuenta actualizada exitosamente',
				accountWithIdNotFoundError: 'Cuenta con id {{id}} no encontrada',
				duplicateError: 'Ya existe una cuenta con este nombre y tipo',
			},
			title: 'Editar cuenta',
			submitButton: 'Actualizar',
		},
	},
	details: {
		meta: {
			title: 'Cuenta {{name}} | Finway',
			notFoundTitle: 'Cuenta {{accountId}} no encontrada | Finway',
			description: 'Cuenta {{name}}',
		},
		loader: {
			notFoundError: 'Cuenta no encontrada',
		},
		action: {
			notFoundError: 'Cuenta no encontrada',
			successToast: 'Cuenta {{name}} eliminada',
			deleteErrorToast: 'No se pudo eliminar la cuenta',
			deleteErrorToastDescription: 'Por favor intenta de nuevo',
		},
		deleteAriaLabel: 'Eliminar cuenta {{name}}',
		deleteTooltip: 'Eliminar una cuenta no se puede deshacer y elimina todas las transacciones, transferencias o intercambios asociados.',
		currencyBalancesTitle: 'Balances por moneda',
		emptyBalances: 'Aún no tienes actividad en esta cuenta.',
	},
} satisfies typeof en
