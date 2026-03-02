import * as React from 'react'

import { cn } from '~/lib/utils'

function PageSection({
	className,
	id,
	...props
}: React.ComponentProps<'section'> & { id?: string }) {
	return (
		<section
			data-slot='page-section'
			className={cn('flex flex-col gap-6', className)}
			aria-labelledby={id}
			{...props}
		/>
	)
}

function PageHeader({ className, ...props }: React.ComponentProps<'header'>) {
	return (
		<header
			data-slot='page-header'
			className={cn('flex items-center justify-between', className)}
			{...props}
		/>
	)
}

function PageContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='page-content'
			className={cn('flex flex-col gap-4', className)}
			{...props}
		/>
	)
}

export { PageSection, PageHeader, PageContent }
