import { NavLink, Outlet } from 'react-router'
import {
	ArrowRightLeftIcon,
	BanknoteArrowDownIcon,
	CalendarSyncIcon,
	WalletIcon,
} from 'lucide-react'

import type { Route } from './+types/private'

import { dbContext, userContext } from '~/lib/context'
import { requireAuthenticated } from '~/utils/auth.server'
import { cn } from '~/lib/utils'

import { FinhubLink } from '~/components/finhub-link'
import { LogoutButton } from '~/components/logout-button'
import { ThemeToggle } from '~/components/theme-toggle'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
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

// NOTE: could refresh the session here if user is authenticated and has an expiration date
const authMiddleware: Route.MiddlewareFunction = async ({
	request,
	context,
}) => {
	const user = await requireAuthenticated(request, context.get(dbContext))
	context.set(userContext, user)
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	return { user }
}

const links = [
	{
		to: '/app/accounts',
		labelKey: 'accounts-label',
		icon: <WalletIcon />,
	},
	{
		to: '/app/transfers',
		labelKey: 'transfers-label',
		icon: <ArrowRightLeftIcon />,
	},
	{
		to: '/app/transactions',
		labelKey: 'transactions-label',
		icon: <BanknoteArrowDownIcon />,
	},
	{
		to: '/app/recurring-transactions',
		labelKey: 'recurring-transactions-label',
		icon: <CalendarSyncIcon />,
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

function SidebarLink({ link }: { link: (typeof links)[number] }) {
	const { isMobile, toggleSidebar } = useSidebar()
	return (
		<SidebarMenuItem key={link.to}>
			<NavLink to={link.to}>
				{({ isActive }) => (
					<SidebarMenuButton
						size='lg'
						isActive={isActive}
						onClick={() => {
							if (isMobile) toggleSidebar()
						}}
					>
						{link.icon}
						{link.labelKey}
					</SidebarMenuButton>
				)}
			</NavLink>
		</SidebarMenuItem>
	)
}

function PrivateLayoutContent({
	user,
}: {
	user: Route.ComponentProps['loaderData']['user']
}) {
	return (
		<>
			<Sidebar>
				<SidebarHeader className='p-4'>
					<FinhubLink />
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{links.map(link => (
									<SidebarLink link={link} key={link.to} />
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
					<p className='leading-7 font-semibold'>{user.email}</p>
					<ThemeToggle />
					<LogoutButton />
				</header>
				<main className='flex-1 mx-auto w-full lg:max-w-6xl md:max-w-3xl py-6 lg:px-12 md:px-8 sm:px-6 px-4 overflow-auto'>
					<Outlet />
				</main>
			</div>
		</>
	)
}
