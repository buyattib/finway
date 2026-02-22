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
} satisfies typeof en
