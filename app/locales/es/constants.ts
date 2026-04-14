import type en from '../en/constants'

export default {
	accountType: {
		bank: 'Banco',
		cash: 'Efectivo',
		digital_wallet: 'Billetera Digital',
		crypto_wallet: 'Billetera Cripto',
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
	categories: {
		housing: {
			name: 'Vivienda',
			description:
				'Alquiler, hipoteca, impuesto inmobiliario, expensas, arreglos, muebles',
		},
		utilities: {
			name: 'Servicios',
			description: 'Luz, gas, agua, internet, teléfono',
		},
		groceries: {
			name: 'Supermercado',
			description: 'Supermercado, comida para cocinar en casa',
		},
		dining_out: {
			name: 'Salidas a Comer',
			description:
				'Restaurantes, cafés, comida para llevar, bares, café, delivery',
		},
		transportation: {
			name: 'Transporte',
			description:
				'Combustible, transporte público, apps de viaje, estacionamiento, seguro del auto, mantenimiento, taxi, apps de transporte',
		},
		health: {
			name: 'Salud',
			description:
				'Obra social, médico, farmacia, dentista, terapia, gimnasio, deportes',
		},
		shopping: {
			name: 'Compras',
			description:
				'Ropa, artículos del hogar, electrónica, retail general',
		},
		entertainment: {
			name: 'Entretenimiento',
			description:
				'Streaming, juegos, conciertos, hobbies, libros, eventos',
		},
		subscriptions: {
			name: 'Suscripciones',
			description:
				'Recurrentes no-entretenimiento (software, membresías)',
		},
		personal_care: {
			name: 'Cuidado Personal',
			description:
				'Peluquería, cosméticos, artículos de tocador, belleza',
		},
		pets: {
			name: 'Mascotas',
			description:
				'Veterinario, comida, peluquería, seguro de mascotas, juguetes',
		},
		travel: {
			name: 'Viajes',
			description:
				'Vuelos, hoteles, gastos de vacaciones (distinto del transporte diario)',
		},
		taxes: {
			name: 'Impuestos',
			description: 'Cualquier pago de impuestos',
		},
		other: {
			name: 'Otros',
			description: 'Debería mantenerse bajo ~5% del gasto',
		},
		income: {
			name: 'Ingresos',
			description: 'Sueldo, freelance, ingresos extra',
		},
		savings_and_investments: {
			name: 'Ahorro e Inversiones',
			description: 'Transferencias a ahorros, broker, jubilación',
		},
		debt_payments: {
			name: 'Pago de Deudas',
			description: 'Capital de préstamos, interéses tarjeta de crédito',
		},
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
