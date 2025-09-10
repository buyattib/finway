import { useEffect } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

export const ToastSessionSchema = z.object({
	type: z.enum(['success', 'message', 'error', 'info', 'warning']),
	title: z.string(),
	description: z.string(),
	id: z.optional(z.string()),
})

export type ToastSession = z.infer<typeof ToastSessionSchema>

export function ShowToast({ type, title, description, id }: ToastSession) {
	useEffect(() => {
		setTimeout(() => {
			toast[type](title, { id, description })
		}, 0)
	}, [description, id, title, type])

	return null
}
