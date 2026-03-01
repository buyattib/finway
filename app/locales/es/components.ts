import type en from '../en/components'

export default {
	root: {
		meta: {
			title: 'Finway',
			errorTitle: 'Error | Finway',
			description: 'El centro de tus finanzas',
		},
		error: {
			unexpected: 'Ocurrió un error inesperado.',
			notFound: 'La página que buscabas no fue encontrada.',
		},
	},
	layout: {
		dashboard: 'Panel',
		accounts: 'Cuentas',
		transactions: 'Transacciones',
		creditCards: 'Tarjetas de Crédito',
		transfers: 'Transferencias',
		exchanges: 'Intercambios',
		transactionCategories: 'Categorías de Transacción',
		logoutButton: 'Cerrar sesión',
	},
	accountType: {
		bank: 'Banco',
		cash: 'Efectivo',
		'digital-wallet': 'Billetera Digital',
		'crypto-wallet': 'Billetera Cripto',
		broker: 'Bróker',
	},
	transactionType: {
		EXPENSE: 'Gasto',
		INCOME: 'Ingreso',
	},
	ccTransactionType: {
		CHARGE: 'Cargo',
		REFUND: 'Reembolso',
	},
	currency: {
		USD: 'Dólar Estadounidense (USD)',
		EUR: 'Euro (EUR)',
		ARS: 'Peso Argentino (ARS)',
		USDT: 'Tether (USDT)',
		USDC: 'USD Coin (USDC)',
		DAI: 'Dai (DAI)',
	},
	ui: {
		close: 'Cerrar',
		toggleSidebar: 'Alternar barra lateral',
		sidebarTitle: 'Barra lateral',
		sidebarDescription: 'Muestra la barra lateral móvil.',
		morePages: 'Más páginas',
		goToPreviousPage: 'Ir a la página anterior',
		goToNextPage: 'Ir a la página siguiente',
		themeToggle: 'Cambiar tema',
		toggleLanguage: 'Cambiar idioma',
		clear: 'Limpiar',
		errorTitle: '¡Oh oh! Hubo un error',
		unknownError: 'Error desconocido',
	},
} satisfies typeof en
