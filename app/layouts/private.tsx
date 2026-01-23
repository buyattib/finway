import {
	NavLink,
	Outlet,
	useNavigation,
	type MiddlewareFunction,
} from 'react-router'
import {
	ArrowRightLeftIcon,
	ArrowUpDownIcon,
	BanknoteArrowDownIcon,
	CreditCard,
	CreditCardIcon,
	LayoutDashboard,
	ListIcon,
	WalletIcon,
} from 'lucide-react'

import type { Route } from './+types/private'

import { authMiddleware } from '~/middleware/auth'
import { userContext } from '~/lib/context'
import { cn } from '~/lib/utils'

import { FinwayLink } from '~/components/finway-link'
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

export const middleware: MiddlewareFunction[] = [authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	return { user }
}

const links = [
	{
		to: '/app/dashboard',
		labelKey: 'Dashboard',
		icon: <LayoutDashboard />,
	},
	{
		to: '/app/accounts',
		labelKey: 'Accounts',
		icon: <WalletIcon />,
	},
	{
		to: '/app/transactions',
		labelKey: 'Transactions',
		icon: <BanknoteArrowDownIcon />,
	},
	{
		to: '/app/credit-cards',
		labelKey: 'Credit Cards',
		icon: <CreditCardIcon />,
	},
	{
		to: '/app/transfers',
		labelKey: 'Transfers',
		icon: <ArrowRightLeftIcon />,
	},
	{
		to: '/app/exchanges',
		labelKey: 'Exchanges',
		icon: <ArrowUpDownIcon />,
	},
	{
		to: '/app/transaction-categories',
		labelKey: 'Transaction Categories',
		icon: <ListIcon />,
	},
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
	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		!navigation.location.search

	const { isMobile, toggleSidebar } = useSidebar()
	const closeSidebar = () => {
		if (isMobile) toggleSidebar()
	}

	return (
		<>
			<Sidebar>
				<SidebarHeader className='p-4'>
					<FinwayLink onClick={closeSidebar} />
					<p className='leading-7 font-semibold sm:hidden'>
						{user.email}
					</p>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{links.map(link => (
									<SidebarMenuItem key={link.to}>
										<NavLink to={link.to}>
											{({ isActive }) => (
												<SidebarMenuButton
													size='lg'
													isActive={isActive}
													onClick={closeSidebar}
												>
													{link.icon}
													{link.labelKey}
												</SidebarMenuButton>
											)}
										</NavLink>
									</SidebarMenuItem>
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
							'opacity-50 pointer-events-none': isLoading,
						},
					)}
				>
					<Outlet />
				</main>
			</div>
		</>
	)
}
