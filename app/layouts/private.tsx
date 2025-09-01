import { Outlet } from 'react-router'

export default function PrivateLayout() {
	return (
		<>
			Private layout
			<Outlet />
		</>
	)
}
