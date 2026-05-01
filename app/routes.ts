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
			route('', 'routes/accounts/index.tsx', [
				route('create', 'routes/accounts/create.tsx'),
				route(':accountId/edit', 'routes/accounts/edit.tsx'),
			]),
			route(':accountId', 'routes/accounts/account.tsx'),
		]),

		// movements (wraps transactions/transfers/exchanges under tabs)
		...prefix('movements', [
			route('', 'routes/movements/index.tsx', [
				route(':movement/create', 'routes/movements/create.tsx'),
				route(
					':movement/:movementId/edit',
					'routes/movements/edit.tsx',
				),
			]),
			route(':movement/:movementId', 'routes/movements/movement.tsx'),
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
						[
							route(
								'pay',
								'routes/credit-cards/statements/pay.tsx',
							),
						],
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
