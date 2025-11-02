import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const textVariants = cva('', {
	variants: {
		size: {
			xs: 'text-xs',
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg',
			xl: 'text-xl',
		},
		alignment: {
			left: 'text-left',
			center: 'text-center',
			right: 'text-right',
		},
		weight: {
			light: 'font-light',
			medium: 'font-medium',
			semi: 'font-semibold',
			bold: 'font-bold',
		},
		theme: {
			primary: 'text-primary',
			foreground: 'text-foreground',
			muted: 'text-muted-foreground',
		},
	},
	defaultVariants: {
		size: 'md',
		alignment: 'left',
		weight: 'medium',
		theme: 'foreground',
	},
})

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
	VariantProps<typeof textVariants>

const textRef = React.forwardRef<HTMLParagraphElement, TextProps>

export const Text = textRef(
	({ className, size, alignment, weight, theme, ...props }, ref) => {
		return (
			<p
				ref={ref}
				className={cn(
					textVariants({ size, alignment, weight, theme, className }),
				)}
				{...props}
			/>
		)
	},
)
