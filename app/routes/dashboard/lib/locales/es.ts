import type en from './en'

export default {
	index: {
		meta: {
			title: 'Panel | Finway',
			description: 'Tu panel financiero',
		},
		summaryCards: {
			totalBalances: 'Balances totales',
			monthExpenses: 'Gastos del mes',
			monthIncomes: 'Ingresos del mes',
			monthCreditCardTotals: 'Totales de tarjeta de crédito del mes',
			noBalances: 'Sin balances',
			noExpenses: 'Sin gastos',
			noIncomes: 'Sin ingresos',
			noInstallments: 'Sin cuotas',
		},
		expensesByCategory: {
			title: 'Gastos por categoría',
			noExpenses: 'Sin gastos',
			createAccount: 'Crear Cuenta',
			createTransaction: 'Crear Transacción',
		},
		expensesByMonth: {
			title: 'Gastos del último año',
			noExpenses: 'Sin gastos',
			createAccount: 'Crear Cuenta',
			createTransaction: 'Crear Transacción',
		},
		monthInstallments: {
			title: 'Cuotas del mes ({{count}})',
			noInstallments: 'No hay cuotas pendientes este mes',
			transactionDate: 'Fecha de transacción',
			dueDate: 'Fecha de pago',
			category: 'Categoría',
			installmentAmount: 'Monto de cuota',
		},
	},
} satisfies typeof en
