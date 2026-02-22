import type en from './en'

export default {
	index: {
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
		create: {
			title: 'Crear una cuenta',
			submitButton: 'Crear',
		},
		edit: {
			title: 'Editar cuenta',
			submitButton: 'Actualizar',
		},
	},
} satisfies typeof en
