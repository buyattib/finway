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
			creditCardDebt: 'Deuda de tarjeta de crédito',
			noBalances: 'Sin balances',
			noExpenses: 'Sin gastos',
			noIncomes: 'Sin ingresos',
			noCreditCardDebt: 'Sin deuda de tarjeta de crédito',
		},
		expensesByCategory: {
			title: 'Gastos por categoría (este mes)',
			empty: 'Sin gastos este mes aún',
		},
		monthlyCreditCardExpenses: {
			title: 'Gastos de tarjeta de crédito por mes',
			empty: 'Sin gastos de tarjeta de crédito aún',
		},
	},
} satisfies typeof en
