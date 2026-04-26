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
		emptyTitle: 'Aún no has creado ninguna cuenta',
		emptySearchMessage:
			'No se encontraron cuentas para la búsqueda {{search}}',
		noBalances: 'Sin balances aún',
		editAction: 'Editar',
		transactionAction: 'Transacción',
		deleteAction: 'Eliminar',
		deleteConfirm: {
			title: '¿Eliminar la cuenta "{{name}}"?',
			description:
				'Esta acción no se puede deshacer y también eliminará todas las transacciones, transferencias e intercambios asociados.',
			cancel: 'Cancelar',
			confirm: 'Eliminar',
		},
	},
	form: {
		description:
			'Las cuentas representan tus cuentas del mundo real donde está tu dinero.',
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
				invalidActionError: 'Acción inválida',
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
				accountWithIdNotFoundError:
					'Cuenta con id {{id}} no encontrada',
				duplicateError: 'Ya existe una cuenta con este nombre y tipo',
				invalidActionError: 'Acción inválida',
			},
			title: 'Editar cuenta',
			submitButton: 'Actualizar',
		},
	},
	delete: {
		action: {
			notFoundError: 'Cuenta no encontrada',
			successToast: 'Cuenta {{name}} eliminada',
			errorToast: 'No se pudo eliminar la cuenta',
			errorToastDescription: 'Por favor intenta de nuevo',
		},
	},
} satisfies typeof en
