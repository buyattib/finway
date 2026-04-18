export default {
	accountType: {
		bank: 'Bank',
		cash: 'Cash',
		'digital-wallet': 'Digital Wallet',
		'crypto-wallet': 'Crypto Wallet',
		broker: 'Broker',
	},
	transactionType: {
		EXPENSE: 'Expense',
		INCOME: 'Income',
	},
	ccTransactionType: {
		EXPENSE: 'Charge',
		INCOME: 'Refund',
	},
	categories: {
		housing: {
			name: 'Housing',
			description:
				'Rent, mortgage, property tax, HOA, repairs, furniture',
		},
		utilities: {
			name: 'Utilities',
			description: 'Electric, gas, water, internet, phone',
		},
		groceries: {
			name: 'Groceries',
			description: 'Supermarket, food delivered for home cooking',
		},
		food_dining: {
			name: 'Food & Dining',
			description: 'Restaurants, cafés, takeout, bars, coffee, delivery',
		},
		transportation: {
			name: 'Transportation',
			description:
				'Gas, public transit, rideshare, parking, car insurance, maintenance, taxi, transport apps',
		},
		health: {
			name: 'Health',
			description:
				'Insurance, doctor, pharmacy, dental, therapy, gym, sports',
		},
		shopping: {
			name: 'Shopping',
			description:
				'Clothing, household goods, electronics, general retail',
		},
		entertainment: {
			name: 'Entertainment',
			description: 'Streaming, games, concerts, hobbies, books, events',
		},
		subscriptions: {
			name: 'Subscriptions',
			description: 'Recurring non-entertainment (software, memberships)',
		},
		personal_care: {
			name: 'Personal Care',
			description: 'Haircuts, cosmetics, toiletries, beauty',
		},
		pets: {
			name: 'Pets',
			description: 'Vet, pet food, grooming, pet insurance, toys',
		},
		travel: {
			name: 'Travel',
			description:
				'Flights, hotels, vacation spending (distinct from daily transport)',
		},
		taxes: {
			name: 'Taxes',
			description: 'Any gov tax payment',
		},
		other: {
			name: 'Other',
			description: 'Should stay under ~5% of spend',
		},
		income: {
			name: 'Income',
			description: 'Salary, freelance, side income',
		},
		savings_and_investments: {
			name: 'Savings & Investments',
			description: 'Transfers to savings, brokerage, retirement',
		},
		debt_payments: {
			name: 'Debt Payments',
			description: 'Loan principal, credit card interest',
		},
	},
	currency: {
		USD: 'US Dollar (USD)',
		EUR: 'Euro (EUR)',
		ARS: 'Argentine Peso (ARS)',
		USDT: 'Tether (USDT)',
		USDC: 'USD Coin (USDC)',
		DAI: 'Dai (DAI)',
	},
}
