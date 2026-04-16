import { NavLink, Outlet, type MiddlewareFunction } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
	ArrowRightLeftIcon,
	RefreshCwIcon,
	BanknoteArrowDownIcon,
	CreditCardIcon,
	LayoutDashboard,
	WalletIcon,
} from 'lucide-react'
import { eq, desc } from 'drizzle-orm'

import type { Route } from './+types/private'

import {
	creditCard as creditCardTable,
	account as accountTable,
} from '~/database/schema'
import { authMiddleware } from '~/middleware/auth'
import { userContext, dbContext } from '~/lib/context'
import { cn, initializeDate } from '~/lib/utils'

import { NavigationProgress } from '~/components/ui/navigation-progress'
import { FinwayLink } from '~/components/finway-link'
import { LogoutButton } from '~/components/logout-button'
import { ThemeToggle } from '~/components/theme-toggle'
import { LocaleToggle } from '~/components/locale-toggle'
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

import { ensureStatementsExist } from '~/routes/credit-cards/lib/queries'

export const middleware: MiddlewareFunction[] = [authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	// Credit card statements check on every load of the app running on the background
	void db
		.select({ id: creditCardTable.id })
		.from(creditCardTable)
		.innerJoin(accountTable, eq(creditCardTable.accountId, accountTable.id))
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(creditCardTable.createdAt))
		.then(async cards => {
			for (const { id } of cards) {
				await ensureStatementsExist({
					db,
					creditCardId: id,
					date: initializeDate(),
				})
			}
		})
		.catch(err => {
			console.error('Failed to ensure credit card statements', err)
		})

	return { user }
}

const links = [
	{
		to: '/app/dashboard',
		labelKey: 'layout.dashboard' as const,
		icon: <LayoutDashboard />,
	},
	{
		to: '/app/accounts',
		labelKey: 'layout.accounts' as const,
		icon: <WalletIcon />,
	},
	{
		to: '/app/transactions',
		labelKey: 'layout.transactions' as const,
		icon: <BanknoteArrowDownIcon />,
	},
	{
		to: '/app/credit-cards',
		labelKey: 'layout.creditCards' as const,
		icon: <CreditCardIcon />,
	},
	{
		to: '/app/transfers',
		labelKey: 'layout.transfers' as const,
		icon: <ArrowRightLeftIcon />,
	},
	{
		to: '/app/exchanges',
		labelKey: 'layout.exchanges' as const,
		icon: <RefreshCwIcon />,
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
	const { t } = useTranslation('components')
	const { isMobile, toggleSidebar } = useSidebar()
	const closeSidebar = () => {
		if (isMobile) toggleSidebar()
	}

	return (
		<>
			<NavigationProgress />
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
													{t(link.labelKey)}
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
			<div className='flex flex-col w-full min-w-0'>
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
						<LocaleToggle />
						<ThemeToggle />
						<LogoutButton />
					</div>
				</header>
				<main className='flex-1 mx-auto w-full lg:max-w-6xl md:max-w-3xl py-6 lg:px-12 md:px-8 sm:px-6 px-4 overflow-auto'>
					<Outlet />
				</main>
			</div>
		</>
	)
}
