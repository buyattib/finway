import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import { getDb } from './db'

const categoryIdMap: Record<string, string> = {
	afbbob6zzph6op52vxi5vhqk: 'Entradas',
	ailx02p73pega1ig7smakphr: 'Verduleria',
	b1pi2m4d47v4o0f20jdj0oz9: 'Seguro Viaje',
	b3qni30m5kp9dor18lrkowb1: 'Dentista',
	bbvoip4nh50inwyr5m9stiui: 'Saldo Inicial',
	bh6089ax0jaxhj5kauwdezt5: 'Pasaje Colectivo',
	bwlwefsf3nc8ppakgpsw9ir3: 'Luz',
	by99px63mti9umxq47z1d70g: 'Gasista',
	cxdd3cdgu1bgowpz0ljecsdp: 'Internet',
	cxdj0wfoiqcb9pj6zgv7ht9x: 'Ferreteria',
	dpwbikmraa31utlx5shp3cle: 'YouTube',
	ewoklqa2pqyhnjsep4gboc19: 'Bar y Restaurante',
	f6fyi6j3q0xatx97n8wf5w2f: 'Limpieza',
	g2etejkmy9k8piw1lcgfyn9m: 'Medico',
	h01dd65qqsykyh3lpu7sdw5u: 'Expensas',
	hf0tqdtx3d3kpi8c1zkjq895: 'Mercado Libre',
	ijjsqxg9tj1fxta7mmufn060: 'Bazar',
	is2cmpr4lxz3h21alfh4shxn: 'Heladeria',
	j3unzfqu5zt8o3qx7lzv69l9: 'Monotributo',
	jzn51ajhy4nhu3s79oca9q1h: 'Pedidos (Comida)',
	k2vi7nfulh3memfsdbggljl6: 'Natacion',
	l9t8uxvs3kbll7ey6a9lpgms: 'Simona',
	mtymim41du32x8v28jajgvew: 'Electricista',
	mzjbnwtjsr58g0gsyo52tc15: 'Icloud',
	n60m2kulwrbcksvnmwt1j4d8: 'Reintegro',
	nt3cdst9lsu4cieqpjtqo67f: 'Farmacia',
	nxpk1suv0w39sottx60saal3: 'Prime',
	oabi287w3uuwmong7o7mtzs3: 'Electrodomesticos',
	opdqtu0b6z2isw1vlwzaiqo0: 'Gastos oficina',
	orefnmphzidpn9wj2ms108xr: 'Pago tarjeta',
	pikfkce5e0mjoqc7dvt5pvm2: 'Inversiones',
	ql6x0mkljeag6kddw3z56nr1: 'Gastos Departamento',
	s1tavusespjk1o5vepott89i: 'Plomero',
	sjghvy0oetwtxvm83lm55j5c: 'Juntadas a comer',
	sr7b7828tspq3vu76pc1ru1o: 'Gimnasio',
	tkd2yeyf57ekaaqq8kso1kot: 'Dietetica',
	tm9j0pnxz44ug77dnu0i9oep: 'Sueldo',
	tobxqj9cnyd2dj5bwr8unia9: 'Peluqueria',
	ufiaco1thsahwiktlw8ladug: 'Mamá',
	vnd93xqh1n3rjhj4vgbzcv3h: 'Interes',
	w2cn0ajbqvysdgbc2jye5wbz: 'Médico',
	wf10c0utv7dy5anckcktpmb8: 'Gas',
	ws6dg0a5xhw1ixib58i8bd7x: 'Alquiler',
	xe9beqljvldyb455r13z4d74: 'Ingresos Brutos',
	xk32o6g8iac69hminbe4nob1: 'Agua',
	xsb84h5as3cbr3fdbt7c0sug: 'Supermercado',
	y8sunkh0xafcdtpueqgzjsgq: 'Panaderia',
}

const USER_CATEGORY_MAPPING = {
	// Housing
	Alquiler: 'housing',
	Expensas: 'housing',
	'Gastos Departamento': 'housing',
	Ferreteria: 'housing', // hardware for home repairs
	Electricista: 'housing',
	Plomero: 'housing',
	Gasista: 'housing',
	Limpieza: 'housing', // cleaning service
	Electrodomesticos: 'housing', // appliances — could argue 'shopping'
	Bazar: 'housing', // homeware — could argue 'shopping'

	// Utilities
	Luz: 'utilities',
	Gas: 'utilities',
	Agua: 'utilities',
	Internet: 'utilities',

	// Groceries
	Supermercado: 'groceries',
	Verduleria: 'groceries',
	Panaderia: 'groceries',
	Dietetica: 'groceries', // health food store — could argue 'health'

	// Dining out
	'Bar y Restaurante': 'dining_out',
	Heladeria: 'dining_out',
	'Juntadas a comer': 'dining_out',
	'Pedidos (Comida)': 'dining_out',

	// Health
	Medico: 'health',
	Médico: 'health',
	Dentista: 'health',
	Farmacia: 'health',
	Gimnasio: 'health',
	Natacion: 'health',

	// Pets
	Simona: 'pets', // dog

	// Shopping
	'Mercado Libre': 'shopping',
	'Gastos oficina': 'shopping',

	// Entertainment
	Entradas: 'entertainment', // tickets for shows

	// Subscriptions
	YouTube: 'subscriptions',
	Prime: 'subscriptions',
	Icloud: 'subscriptions',

	// Personal care
	Peluqueria: 'personal_care',

	// Travel
	'Seguro Viaje': 'travel',
	'Pasaje Colectivo': 'travel',

	// Income
	Sueldo: 'income',
	Interes: 'income', // yield / interest earned on money
	Reintegro: 'income', // reimbursements from CC or bank promos
	'Saldo Inicial': 'income', // initial balance bookkeeping entry

	// Savings & investments
	Inversiones: 'savings_and_investments',

	// Taxes
	Monotributo: 'taxes',
	'Ingresos Brutos': 'taxes',

	// Other
	Mamá: 'other', // transfers to mom — consider a 'family/gifts' bucket if frequent

	'Pago tarjeta': 'debt_payments', // credit card payment: transfer, not an expense (spending already categorized per-tx)
} as const

const db = getDb(schema)

await db.transaction(async tx => {
	for (const [id, name] of Object.entries(categoryIdMap)) {
		const category =
			USER_CATEGORY_MAPPING[name as keyof typeof USER_CATEGORY_MAPPING]
		if (!category) {
			console.warn(`No mapping for "${name}" (${id})`)
			continue
		}

		await tx
			.update(schema.transaction)
			.set({ category })
			.where(eq(schema.transaction.transactionCategoryId, id))

		await tx
			.update(schema.creditCardTransaction)
			.set({ category })
			.where(eq(schema.creditCardTransaction.transactionCategoryId, id))
	}
})
