import type { TFunction } from 'i18next'
import { Button, Html } from '@react-email/components'

export default async function LoginEmail({
	url,
	t,
}: {
	url: string
	t: TFunction<'emails'>
}) {
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
				{t('login.button')}
			</Button>
		</Html>
	)
}
