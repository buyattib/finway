import type { TFunction } from 'i18next'
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from '@react-email/components'

export default async function LoginEmail({
	url,
	t,
}: {
	url: string
	t: TFunction<'emails'>
}) {
	return (
		<Html>
			<Head />
			<Preview>{t('login.preview')}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Heading style={heading}>Finway</Heading>
					<Text style={text}>{t('login.greeting')}</Text>
					<Text style={text}>{t('login.instruction')}</Text>
					<Section style={buttonSection}>
						<Button href={url} style={button}>
							{t('login.button')}
						</Button>
					</Section>
					<Text style={footnote}>{t('login.expiration')}</Text>
					<Hr style={hr} />
					<Text style={disclaimer}>{t('login.disclaimer')}</Text>
				</Container>
			</Body>
		</Html>
	)
}

const body: React.CSSProperties = {
	backgroundColor: '#f6f6f6',
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container: React.CSSProperties = {
	backgroundColor: '#ffffff',
	margin: '40px auto',
	padding: '32px',
	borderRadius: '8px',
	maxWidth: '480px',
}

const heading: React.CSSProperties = {
	fontSize: '24px',
	fontWeight: '700',
	textAlign: 'center' as const,
	margin: '0 0 24px',
	color: '#111',
}

const text: React.CSSProperties = {
	fontSize: '15px',
	lineHeight: '24px',
	color: '#333',
	margin: '0 0 16px',
}

const buttonSection: React.CSSProperties = {
	textAlign: 'center' as const,
	margin: '24px 0',
}

const button: React.CSSProperties = {
	backgroundColor: '#000',
	color: '#fff',
	padding: '14px 28px',
	borderRadius: '6px',
	fontSize: '15px',
	fontWeight: '600',
	textDecoration: 'none',
}

const footnote: React.CSSProperties = {
	fontSize: '13px',
	color: '#666',
	textAlign: 'center' as const,
	margin: '0 0 16px',
}

const hr: React.CSSProperties = {
	borderColor: '#e5e5e5',
	margin: '16px 0',
}

const disclaimer: React.CSSProperties = {
	fontSize: '12px',
	color: '#999',
	textAlign: 'center' as const,
	margin: '0',
}
