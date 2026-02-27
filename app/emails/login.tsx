import { useTranslation } from 'react-i18next'
import { Button, Html } from '@react-email/components'

export function LoginEmail({ url }: { url: string }) {
	const { t } = useTranslation('emails')
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
