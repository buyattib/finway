import type en from '../en/emails'

export default {
	login: {
		preview: 'Tu enlace de inicio de sesión para Finway',
		greeting: 'Hola,',
		instruction:
			'Hacé clic en el botón de abajo para iniciar sesión en tu cuenta de Finway. No necesitás contraseña.',
		button: 'Iniciar Sesión en Finway',
		expiration: 'Este enlace expira en 15 minutos.',
		disclaimer:
			'Si no solicitaste este correo, podés ignorarlo con tranquilidad.',
	},
} satisfies typeof en
