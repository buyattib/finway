import type en from '../en/components'

export default {
	accountType: {
		bank: 'Banco',
		cash: 'Efectivo',
		digitalWallet: 'Billetera Digital',
		cryptoWallet: 'Billetera Cripto',
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
