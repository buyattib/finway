import { PassThrough } from 'node:stream'
import { isbot } from 'isbot'
import { createReadableStreamFromReadable } from '@react-router/node'
import {
	ServerRouter,
	type RouterContextProvider,
	type EntryContext,
} from 'react-router'
import {
	renderToPipeableStream,
	type RenderToPipeableStreamOptions,
} from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'

import './utils-server/env.server'

import { getInstance } from './middleware/i18next'
import { globalContext } from './lib/context'

export const streamTimeout = 5_000

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	entryContext: EntryContext,
	routerContext: RouterContextProvider,
) {
	return new Promise((resolve, reject) => {
		let shellRendered = false
		const userAgent = request.headers.get('user-agent')

		// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
		// https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
		const readyOption: keyof RenderToPipeableStreamOptions =
			(userAgent && isbot(userAgent)) || entryContext.isSpaMode
				? 'onAllReady'
				: 'onShellReady'

		// Abort the rendering stream after the `streamTimeout` so it has time to
		// flush down the rejected boundaries
		let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
			() => abort(),
			streamTimeout + 1000,
		)

		const ctx = routerContext.get(globalContext)
		const { pipe, abort } = renderToPipeableStream(
			<I18nextProvider i18n={getInstance(routerContext)}>
				<ServerRouter
					nonce={ctx.cspNonce}
					context={entryContext}
					url={request.url}
				/>
			</I18nextProvider>,
			{
				[readyOption]() {
					shellRendered = true
					const body = new PassThrough({
						final(callback) {
							// Clear the timeout to prevent retaining the closure and memory leak
							clearTimeout(timeoutId)
							timeoutId = undefined
							callback()
						},
					})
					const stream = createReadableStreamFromReadable(body)

					responseHeaders.set('Content-Type', 'text/html')

					pipe(body)

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					)
				},
				onShellError(error: unknown) {
					reject(error)
				},
				onError(error: unknown) {
					responseStatusCode = 500
					// Log streaming rendering errors from inside the shell.  Don't log
					// errors encountered during initial shell rendering since they'll
					// reject and get logged in handleDocumentRequest.
					if (shellRendered) {
						console.error(error)
					}
				},
				nonce: ctx.cspNonce,
			},
		)
	})
}
