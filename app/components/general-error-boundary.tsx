import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'
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
	return null
}

export function GeneralErrorBoundary({
	statusHandlers,
}: {
	statusHandlers?: Record<number, StatusHandler>
}) {
	const { t } = useTranslation('components')
	const error = useRouteError()
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	if (!isRouteErrorResponse(error)) {
		return (
			<AlertContainer>
				<p>{getErrorMessage(error) ?? t('ui.unknownError')}</p>
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
	const { t } = useTranslation('components')

	return (
		<Alert variant='destructive'>
			<AlertCircleIcon />
			<AlertTitle>{t('ui.errorTitle')}</AlertTitle>
			<AlertDescription>{children}</AlertDescription>
		</Alert>
	)
}
