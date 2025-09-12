import {
	type RouteConfig,
	layout,
	index,
	route,
	prefix,
} from '@react-router/dev/routes'

export default [
	route('/authenticate/:token', 'routes/auth/authenticate.tsx'),
	route('/logout', 'routes/auth/logout.tsx'),

	layout('layouts/public.tsx', [route('login', 'routes/auth/login.tsx')]),

	layout('layouts/private.tsx', [
		index('routes/dashboard.tsx'),

		...prefix('accounts', [
			index('routes/accounts.tsx'),
			route(':accountId', 'routes/account.tsx'),
		]),
	]),
] satisfies RouteConfig
