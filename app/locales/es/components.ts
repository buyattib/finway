import type en from '../en/components'

export default {
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
