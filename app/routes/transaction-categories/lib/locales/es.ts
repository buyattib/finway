import type en from './en'

export default {
	index: {
		meta: {
			title: 'Categorías de transacción | Finway',
			description: 'Tus categorías de transacción',
		},
		title: 'Categorías de Transacción',
		addCategoryLabel: 'Categoría',
		emptyMessage:
			'Aún no has creado ninguna categoría de transacción. Empieza a crearlas <0>aquí</0>.',
		deleteAriaLabel: 'Eliminar categoría {{name}}',
		deleteTooltip:
			'Eliminar una categoría no se puede deshacer y las transacciones asociadas serán eliminadas.',
		action: {
			deleteErrorToast: 'No se pudo eliminar la categoría de transacción',
			deleteErrorToastDescription: 'Por favor intenta de nuevo',
			notFoundError:
				'Categoría de transacción {{transactionCategoryId}} no encontrada',
			successToast: 'Categoría de transacción eliminada',
		},
		suggestions: {
			triggerButton: 'Sugeridas',
			title: 'Categorías Sugeridas',
			description: 'Selecciona categorías para agregarlas rápidamente.',
			addButton: 'Agregar Seleccionadas',
			categories: {
				housing: 'Vivienda',
				transportation: 'Transporte',
				foodAndGroceries: 'Comida y Supermercado',
				diningOut: 'Restaurantes',
				utilities: 'Servicios',
				healthcare: 'Salud',
				entertainment: 'Entretenimiento',
				shopping: 'Compras',
				clothing: 'Ropa',
				education: 'Educación',
				savings: 'Ahorros',
				investments: 'Inversiones',
				travel: 'Viajes',
				subscriptions: 'Suscripciones',
				insurance: 'Seguros',
				personalCare: 'Cuidado Personal',
				fitness: 'Fitness',
				pets: 'Mascotas',
				donations: 'Donaciones',
				salary: 'Salario',
				freelance: 'Freelance',
				gifts: 'Regalos',
				other: 'Otros',
			},
			successToast: 'Categorías agregadas exitosamente',
			noneSelectedError: 'Por favor selecciona al menos una categoría',
		},
	},
	form: {
		description:
			'Las categorías de transacción se usan para clasificar tus gastos e ingresos',
		nameLabel: 'Nombre',
		descriptionLabel: 'Descripción (Opcional)',
		schema: {
			nameRequired: 'El nombre es requerido',
		},
		create: {
			meta: {
				title: 'Crear Categorías de Transacción | Finway',
				description:
					'Crea categorías de transacción para asignar a tus transacciones',
			},
			action: {
				successToast: 'Categoría de transacción creada',
				duplicateError:
					'Ya existe una categoría de transacción con este nombre',
			},
			title: 'Crear una categoría de transacción',
			submitButton: 'Crear',
		},
	},
} satisfies typeof en
