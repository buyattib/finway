import type en from './en'

export default {
	login: {
		meta: {
			title: 'Iniciar sesión en Finway',
		},
		title: '¡Bienvenido!',
		description:
			'Te enviaremos un correo electrónico con un enlace para iniciar sesión',
		emailLabel: 'Correo electrónico',
		rememberLabel: 'Recordarme',
		submitButton: 'Enviar',
		honeypotLabel: 'Por favor deja este campo en blanco',
		schema: {
			emailInvalid: 'El correo electrónico es inválido',
			emailTooShort: 'El correo electrónico es muy corto',
			emailTooLong: 'El correo electrónico es muy largo',
		},
		action: {
			emailSubject: 'Bienvenido a Finway - Tu enlace de inicio de sesión',
			errorToast: 'Hubo un error al enviar el enlace de inicio de sesión',
			errorDescription: 'Por favor intenta de nuevo',
			welcomeBackToast: '¡Bienvenido de vuelta!',
			welcomeToast: '¡Bienvenido a Finway!',
			successDescription:
				'Te enviamos un correo electrónico con un enlace para iniciar sesión',
		},
	},
	authenticate: {
		action: {
			errorToast: 'Error al iniciar sesión',
			successToast: '¡Sesión iniciada!',
			successDescription: 'Iniciaste sesión exitosamente',
		},
	},
	magicLink: {
		invalidEmail:
			'Enlace de inicio de sesión inválido (el correo no es una cadena de texto). Por favor solicita uno nuevo.',
		invalidExpiration:
			'Enlace de inicio de sesión inválido (la expiración del enlace no es una cadena de texto). Por favor solicita uno nuevo.',
		expired:
			'El enlace de inicio de sesión expiró. Por favor solicita uno nuevo.',
		invalidPayload:
			'Enlace de inicio de sesión inválido (los datos del enlace son inválidos). Por favor solicita uno nuevo.',
	},
} satisfies typeof en
