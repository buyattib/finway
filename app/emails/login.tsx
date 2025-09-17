import { Button, Html } from '@react-email/components'

export function LoginEmail({ url }: { url: string }) {
	return (
		<Html>
			<Button
				href={url}
				style={{
					background: '#000',
					color: '#fff',
					padding: '12px 20px',
				}}
			>
				Log In
			</Button>
		</Html>
	)
}
