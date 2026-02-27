export default {
	login: {
		meta: {
			title: 'Login to Finway',
		},
		title: 'Welcome!',
		description: 'We are going to send you an email with a login link',
		emailLabel: 'Email',
		rememberLabel: 'Remember me',
		submitButton: 'Submit',
		schema: {
			emailInvalid: 'Email is invalid',
			emailTooShort: 'Email is too short',
			emailTooLong: 'Email is too long',
		},
		action: {
			emailSubject: 'Welcome to Finway - Your Login Link',
			errorToast: 'There was an error sending the login link',
			errorDescription: 'Please try again',
			welcomeBackToast: 'Welcome back!',
			welcomeToast: 'Welcome to Finway!',
			successDescription: 'We sent you an email with a link to log in',
		},
	},
	authenticate: {
		action: {
			errorToast: 'Error logging in',
			successToast: 'Logged in!',
			successDescription: 'You were successfully logged in',
		},
	},
	magicLink: {
		invalidEmail:
			'Sign in link invalid (email is not a string). Please request a new one.',
		invalidExpiration:
			'Sign in link invalid (link expiration is not a string). Please request a new one.',
		expired: 'Magic link expired. Please request a new one.',
		invalidPayload:
			'Sign in link invalid (link payload is invalid). Please request a new one.',
	},
}
