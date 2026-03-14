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
import type { TFunction } from 'i18next'

import defaults from '../locales/en/emails'

export default async function LoginEmail({
	url = 'https://example.com/login',
	t,
}: {
	url?: string
	t?: TFunction<'emails'>
}) {
	const translations = {
		preview: t?.('login.preview') ?? defaults.login.preview,
		greeting: t?.('login.greeting') ?? defaults.login.greeting,
		instruction: t?.('login.instruction') ?? defaults.login.instruction,
		button: t?.('login.button') ?? defaults.login.button,
		expiration: t?.('login.expiration') ?? defaults.login.expiration,
		disclaimer: t?.('login.disclaimer') ?? defaults.login.disclaimer,
	}

	return (
		<Html>
			<Head />
			<Preview>{translations.preview}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Heading style={heading}>Finway</Heading>
					<Text style={text}>{translations.greeting}</Text>
					<Text style={text}>{translations.instruction}</Text>
					<Section style={buttonSection}>
						<Button href={url} style={btnStyle}>
							{translations.button}
						</Button>
					</Section>
					<Text style={footnote}>{translations.expiration}</Text>
					<Hr style={hr} />
					<Text style={disclaimerStyle}>
						{translations.disclaimer}
					</Text>
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

const btnStyle: React.CSSProperties = {
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

const disclaimerStyle: React.CSSProperties = {
	fontSize: '12px',
	color: '#999',
	textAlign: 'center' as const,
	margin: '0',
}
