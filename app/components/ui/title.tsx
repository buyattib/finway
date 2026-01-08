import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const titleVariants = cva(
	'scroll-m-20 tracking-tight text-black/70 dark:text-foreground',
	{
		variants: {
			variant: {
				h1: 'text-4xl font-extrabold text-balance',
				h2: 'text-3xl font-semibold border-b pb-2 first:mt-0',
				h3: 'text-2xl font-semibold',
				h4: 'text-xl font-semibold',
				h5: 'text-lg font-semibold',
			},
			alignment: {
				left: 'text-left',
				center: 'text-center',
				right: 'text-right',
			},
		},
		defaultVariants: {
			variant: 'h1',
			alignment: 'left',
		},
	},
)

type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
type TitleProps = React.HTMLAttributes<HTMLHeadingElement> &
	VariantProps<typeof titleVariants> & {
		level: TitleLevel
	}

const titleRef = React.forwardRef<HTMLHeadingElement, TitleProps>

export const Title = titleRef(
	({ className, level, alignment, ...props }, ref) => {
		const Component = level
		return (
			<Component
				ref={ref}
				className={cn(
					titleVariants({ variant: level, alignment, className }),
				)}
				{...props}
			/>
		)
	},
)
