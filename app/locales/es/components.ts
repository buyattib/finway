import type en from '../en/components'

export default {
	layout: {
		nav: {
			dashboard: 'Panel',
			accounts: 'Cuentas',
			transactions: 'Transacciones',
			creditCards: 'Tarjetas de Crédito',
			transfers: 'Transferencias',
			exchanges: 'Intercambios',
			transactionCategories: 'Categorías de Transacción',
		},
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
} satisfies typeof en
