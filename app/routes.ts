import {
	type RouteConfig,
	layout,
	index,
	route,
	prefix,
} from '@react-router/dev/routes'

export default [
	route('/', 'routes/index.tsx'),

	route('/authenticate', 'routes/auth/authenticate.tsx'),
	route('/logout', 'routes/auth/logout.tsx'),

	layout('components/layouts/public.tsx', [
		route('login', 'routes/auth/login.tsx'),
	]),

	route('app', 'components/layouts/private.tsx', [
		index('routes/app.tsx'),
		route('dashboard', 'routes/dashboard/index.tsx'),

		// accounts
		...prefix('accounts', [
			index('routes/accounts/index.tsx'),
			route(':accountId', 'routes/accounts/account.tsx'),
			route(':accountId/edit', 'routes/accounts/edit.tsx'),
			route('create', 'routes/accounts/create.tsx'),
		]),

		// movements (wraps transactions/transfers/exchanges under tabs)
		...prefix('movements', [index('routes/movements/index.tsx')]),

		// transactions
		...prefix('transactions', [
			index('routes/transactions/index.tsx'),
			route('create', 'routes/transactions/create.tsx'),
			route(':transactionId/edit', 'routes/transactions/edit.tsx'),
		]),

		// transfers
		...prefix('transfers', [
			index('routes/transfers/index.tsx'),
			route('create', 'routes/transfers/create.tsx'),
		]),

		// exchanges
		...prefix('exchanges', [
			index('routes/exchanges/index.tsx'),
			route('create', 'routes/exchanges/create.tsx'),
		]),

		// credit cards
		...prefix('credit-cards', [
			index('routes/credit-cards/cards/index.tsx'),
			route('create', 'routes/credit-cards/cards/create.tsx'),

			...prefix(':creditCardId', [
				layout('routes/credit-cards/cards/credit-card-layout.tsx', [
					// cc details
					index('routes/credit-cards/cards/credit-card.tsx'),
					route('edit', 'routes/credit-cards/cards/edit.tsx'),

					// cc statement details
					route(
						'statements/:statementId',
						'routes/credit-cards/statements/statement.tsx',
					),
					route(
						'statements/:statementId/edit',
						'routes/credit-cards/statements/edit.tsx',
					),

					// cc transaction
					route(
						'transactions/:transactionId',
						'routes/credit-cards/transactions/transaction.tsx',
					),
					route(
						'transactions/:transactionId/edit',
						'routes/credit-cards/transactions/edit.tsx',
					),
					route(
						'transactions/create',
						'routes/credit-cards/transactions/create.tsx',
					),
				]),
			]),
		]),
	]),
] satisfies RouteConfig
