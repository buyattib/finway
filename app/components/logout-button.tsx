import { Form } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LogOutIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'

export function LogoutButton() {
	const { t } = useTranslation('components')

	return (
		<Form method='post' action='/logout'>
			<Button type='submit' size='icon' variant='link'>
				<LogOutIcon />
				<span className='sr-only'>{t('layout.logoutButton')}</span>
			</Button>
		</Form>
	)
}
