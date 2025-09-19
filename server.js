import crypto from 'node:crypto'
import compression from 'compression'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

// Short-circuit the type-checking of the built output.
const BUILD_PATH = './build/server/index.js'
const DEVELOPMENT = process.env.NODE_ENV === 'development'
const PORT = Number.parseInt(process.env.PORT || '3000')

const app = express()

// no ending slashes for SEO reasons: https://github.com/epicweb-dev/epic-stack/discussions/108
app.get('/*splat', (req, res, next) => {
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length)
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
		res.redirect(302, safepath + query)
	} else {
		next()
	}
})

// middleware to gzip responses and improve performance
app.use(compression())

// // Helmet is a middleware function that sets security-related HTTP response headers: https://expressjs.com/es/advanced/best-practice-security.html
app.use((req, res, next) => {
	const nonce = crypto.randomBytes(32).toString('base64')
	res.locals.cspNonce = nonce
	const _helmet = helmet({
		contentSecurityPolicy:
			process.env.NODE_MODE === 'production'
				? {
						directives: {
							'script-src': ["'self'", `'nonce-${nonce}'`],
						},
					}
				: false,
	})
	_helmet(req, res, next)
})

if (!DEVELOPMENT) {
	// Add rate limiting to all requests
	const defaultLimiter = {
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 1000,
		standardHeaders: true, // Use standard draft-6 headers of `RateLimit-Policy` `RateLimit-Limit`, and `RateLimit-Remaining`
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	}
	const generalLimiter = rateLimit(defaultLimiter)
	const strongLimiter = rateLimit({
		...defaultLimiter,
		limit: 100,
	})
	const strongestLimiter = rateLimit({ ...defaultLimiter, limit: 10 })
	app.use((req, res, next) => {
		const sensiblePaths = ['/login']
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			if (sensiblePaths.some(sPath => req.path.includes(sPath))) {
				return strongestLimiter(req, res, next)
			}
			return strongLimiter(req, res, next)
		}

		// the verify route is a special case because it's a GET route that
		// can have a token in the query string
		if (req.path.includes('/authenticate')) {
			return strongestLimiter(req, res, next)
		}

		return generalLimiter(req, res, next)
	})
}

if (DEVELOPMENT) {
	console.log('Starting development server')
	const viteDevServer = await import('vite').then(vite =>
		vite.createServer({
			server: { middlewareMode: true },
		}),
	)
	app.use(viteDevServer.middlewares)
	app.use(async (req, res, next) => {
		try {
			// app.ts is the actual "api", here it loads on every request in middleware so we get hot reloads
			const source = await viteDevServer.ssrLoadModule('./server/app.ts')
			return await source.app(req, res, next)
		} catch (error) {
			if (typeof error === 'object' && error instanceof Error) {
				viteDevServer.ssrFixStacktrace(error)
			}
			next(error)
		}
	})
} else {
	console.log('Starting production server')

	// RRv7 fingerprints (adds a hash to the name) its assets so we can cache forever.
	app.use(
		'/assets',
		express.static('build/client/assets', {
			immutable: true,
			maxAge: '1y',
		}),
	)

	// Everything else is cached for an hour
	app.use(express.static('build/client', { maxAge: '1h' }))

	// logger
	morgan.token('url', req => {
		try {
			return decodeURIComponent(req.url ?? '')
		} catch {
			return req.url ?? ''
		}
	})
	app.use(
		morgan('tiny', {
			skip: (req, res) =>
				res.statusCode === 200 &&
				(req.url?.startsWith('/resources/images') ||
					req.url?.startsWith('/resources/healthcheck')),
		}),
	)

	app.use(await import(BUILD_PATH).then(mod => mod.app))
}

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
