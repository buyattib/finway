import { type RouteConfig, layout, index, route, prefix } from '@react-router/dev/routes'

export default [
	layout('layouts/public.tsx', [route('login', 'routes/login.tsx')]),

	layout('layouts/private.tsx', [
		index('routes/dashboard.tsx'),

		...prefix('accounts', [
			index('routes/accounts.tsx'),
			route(':accountId', 'routes/account.tsx'),
		]),
	]),
] satisfies RouteConfig
