import { type JSX } from 'react'
import {
	isRouteErrorResponse,
	useParams,
	useRouteError,
	type ErrorResponse,
} from 'react-router'
import { AlertCircleIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

type StatusHandler = (info: {
	error: ErrorResponse
	params: Record<string, string | undefined>
}) => JSX.Element | null

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}

	if (
		error &&
		typeof error === 'object' &&
		'error' in error &&
		typeof error.error === 'string'
	) {
		return error.error
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function GeneralErrorBoundary({
	statusHandlers,
}: {
	statusHandlers?: Record<number, StatusHandler>
}) {
	const error = useRouteError()
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	if (!isRouteErrorResponse(error)) {
		return (
			<AlertContainer>
				<p>{getErrorMessage(error)}</p>
			</AlertContainer>
		)
	}

	const handler = statusHandlers?.[error.status]
	if (handler) {
		return <AlertContainer>{handler({ error, params })}</AlertContainer>
	}

	return (
		<AlertContainer>
			<p>
				{error.status} {error.data}
			</p>
		</AlertContainer>
	)
}

export function AlertContainer({ children }: { children: React.ReactNode }) {
	return (
		<Alert variant='destructive'>
			<AlertCircleIcon />
			<AlertTitle>Oh oh! There was an error</AlertTitle>
			<AlertDescription>{children}</AlertDescription>
		</Alert>
	)
}
