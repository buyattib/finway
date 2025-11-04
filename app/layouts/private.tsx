import {
	NavLink,
	Outlet,
	useNavigation,
	type MiddlewareFunction,
} from 'react-router'
import {
	ArrowRightLeftIcon,
	BanknoteArrowDownIcon,
	CalendarSyncIcon,
	WalletIcon,
} from 'lucide-react'

import type { Route } from './+types/private'

import { authMiddleware } from '~/middleware/auth'
import { userContext } from '~/lib/context'
import { cn } from '~/lib/utils'

import { FinhubLink } from '~/components/finhub-link'
import { LogoutButton } from '~/components/logout-button'
import { ThemeToggle } from '~/components/theme-toggle'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from '~/components/ui/sidebar'
import { Spinner } from '~/components/ui/spinner'

// NOTE: could refresh the session here if user is authenticated and has an expiration date

export const middleware: MiddlewareFunction[] = [authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	return { user }
}

const links = [
	{
		to: '/app/accounts',
		labelKey: 'Accounts',
		icon: <WalletIcon />,
	},
	// {
	// 	to: '/app/transfers',
	// 	labelKey: 'transfers-label',
	// 	icon: <ArrowRightLeftIcon />,
	// },
	// {
	// 	to: '/app/transactions',
	// 	labelKey: 'transactions-label',
	// 	icon: <BanknoteArrowDownIcon />,
	// },
	// {
	// 	to: '/app/recurring-transactions',
	// 	labelKey: 'recurring-transactions-label',
	// 	icon: <CalendarSyncIcon />,
	// },
]

export default function PrivateLayout({
	loaderData: { user },
}: Route.ComponentProps) {
	return (
		<SidebarProvider>
			<PrivateLayoutContent user={user} />
		</SidebarProvider>
	)
}

function PrivateLayoutContent({
	user,
}: {
	user: Route.ComponentProps['loaderData']['user']
}) {
	const navigation = useNavigation()

	const { isMobile, toggleSidebar } = useSidebar()
	const closeSidebar = () => {
		if (isMobile) toggleSidebar()
	}

	return (
		<>
			<Sidebar>
				<SidebarHeader className='p-4'>
					<FinhubLink onClick={closeSidebar} />
					<p className='leading-7 font-semibold sm:hidden'>
						{user.email}
					</p>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{links.map(link => (
									<SidebarLink
										link={link}
										key={link.to}
										onClick={closeSidebar}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<div className='flex flex-col w-full'>
				<header
					className={cn(
						'flex items-center justify-between sm:justify-end gap-2 p-4 lg:px-12 border-b-2 border-b-secondary',
					)}
				>
					<SidebarTrigger className='md:hidden' />
					<p className='leading-7 font-semibold sm:block hidden'>
						{user.email}
					</p>
					<div className='flex items-center gap-2'>
						<ThemeToggle />
						<LogoutButton />
					</div>
				</header>
				<main
					className={cn(
						'flex-1 mx-auto w-full lg:max-w-6xl md:max-w-3xl py-6 lg:px-12 md:px-8 sm:px-6 px-4 overflow-auto',
						{
							'opacity-50 pointer-events-none':
								navigation.state === 'loading',
						},
					)}
				>
					{navigation.state === 'loading' && (
						<Spinner size='md' className='mx-auto' />
					)}
					<Outlet />
				</main>
			</div>
		</>
	)
}

function SidebarLink({
	link,
	onClick,
}: {
	link: (typeof links)[number]
	onClick: () => void
}) {
	return (
		<SidebarMenuItem key={link.to}>
			<NavLink to={link.to}>
				{({ isActive }) => (
					<SidebarMenuButton
						size='lg'
						isActive={isActive}
						onClick={onClick}
					>
						{link.icon}
						{link.labelKey}
					</SidebarMenuButton>
				)}
			</NavLink>
		</SidebarMenuItem>
	)
}
