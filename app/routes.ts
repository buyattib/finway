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

	route('/', 'routes/index.tsx'),

	route('app', 'layouts/private.tsx', [
		index('routes/dashboard.tsx'),

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
	]),
] satisfies RouteConfig
