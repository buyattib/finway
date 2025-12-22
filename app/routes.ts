import {
	type RouteConfig,
	layout,
	index,
	route,
	prefix,
} from '@react-router/dev/routes'

export default [
	route('/authenticate', 'routes/auth/authenticate.tsx'),
	route('/logout', 'routes/auth/logout.tsx'),

	layout('layouts/public.tsx', [route('login', 'routes/auth/login.tsx')]),

	route('/', 'routes/app.tsx'),

	route('app', 'layouts/private.tsx', [
		index('routes/index.tsx'),
		route('dashboard', 'routes/dashboard.tsx'),

		// accounts
		...prefix('accounts', [
			index('routes/accounts/index.tsx'),
			route(':accountId', 'routes/accounts/account.tsx'),
			route(':accountId/edit', 'routes/accounts/edit.tsx'),
			route('create', 'routes/accounts/create.tsx'),
		]),

		// transactions
		...prefix('transactions', [
			index('routes/transactions/index.tsx'),
			route('create', 'routes/transactions/create.tsx'),
			route(':transactionId/edit', 'routes/transactions/edit.tsx'),
		]),

		// transaction categories
		...prefix('transaction-categories', [
			index('routes/transaction-categories/index.tsx'),
			route('create', 'routes/transaction-categories/create.tsx'),
		]),

		// transfers
		...prefix('transfers', [
			index('routes/transfers/index.tsx'),
			// route('create', 'routes/transfers/create.tsx'),
		]),

		// exchanges
		// ...prefix('exchanges', [
		// 	index('routes/exchanges/index.tsx'),
		// 	route('create', 'routes/exchanges/create.tsx'),
		// ]),
	]),
] satisfies RouteConfig
