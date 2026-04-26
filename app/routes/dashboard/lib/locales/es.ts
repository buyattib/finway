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
			noBalances: 'Sin balances',
			noExpenses: 'Sin gastos',
			noIncomes: 'Sin ingresos',
		},
		expensesByCategory: {
			title: 'Gastos por categoría (este mes)',
			empty: 'Sin gastos',
		},
	},
} satisfies typeof en
