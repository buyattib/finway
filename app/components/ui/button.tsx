import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

import { Spinner } from './spinner'

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:cursor-pointer",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				black: 'bg-foreground text-background shadow-xs hover:bg-foreground/80',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				'destructive-ghost':
					'text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				'destructive-outline':
					'text-destructive border border-destructive/30 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				outline:
					'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				secondary:
					'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 px-6 has-[>svg]:px-4',
				'icon-lg': 'size-10',
				icon: 'size-9',
				'icon-sm': 'size-7',
				'icon-xs': 'size-6',
			},
			width: {
				full: 'w-full',
				fit: 'w-fit',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

export type ButtonProps = React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
		loading?: boolean
	}

function Button({
	className,
	variant,
	size,
	width,
	loading,
	asChild = false,
	...props
}: ButtonProps) {
	const cls = cn(buttonVariants({ variant, size, width, className }))

	if (asChild) {
		return <Slot data-slot='button' className={cls} {...props} />
	}

	const { children, ...rest } = props
	return (
		<button data-slot='button' className={cls} {...rest}>
			{loading && <Spinner />}
			{children}
		</button>
	)
}

export { Button, buttonVariants }
