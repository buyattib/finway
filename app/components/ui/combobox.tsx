import { flushSync } from 'react-dom'
import * as React from 'react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { cn } from '~/lib/utils'

import { Button } from './button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type ComboboxProps = {
	options: Array<{ value: string; label: string; icon?: React.ReactNode }>
	id?: string
	name?: string
	onValueChange?: (value: string) => void
	defaultValue?: string
	buttonPlaceholder?: string
	inputPlaceholder?: string
	emptyPlaceholder?: string
	buttonProps?: React.ComponentProps<'button'>
}

export function Combobox({
	options,
	id,
	name,
	onValueChange,
	defaultValue,
	buttonPlaceholder,
	inputPlaceholder,
	emptyPlaceholder,
	buttonProps,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState(defaultValue ?? '')

	const selected = options.find(option => option.value === value)
	const buttonDisplay = selected ? (
		<div className='flex items-center gap-2'>
			{selected.icon} {selected.label}
		</div>
	) : (
		buttonPlaceholder
	)

	return (
		<>
			<input type='hidden' id={id} name={name} value={value} />
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						{...buttonProps}
						variant='outline'
						role='combobox'
						aria-expanded={open}
						width='full'
						className={cn('justify-between', {
							'text-muted-foreground': !selected,
						})}
					>
						{buttonDisplay}
						<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className='p-0'>
					<Command>
						<CommandInput placeholder={inputPlaceholder} />
						<CommandList>
							<CommandEmpty>
								{emptyPlaceholder ?? 'No results found'}
							</CommandEmpty>
							<CommandGroup>
								{options.map(option => (
									<CommandItem
										key={option.value}
										value={option.value}
										keywords={[option.label.toLowerCase()]}
										onSelect={currentValue => {
											const newValue =
												currentValue === value
													? ''
													: currentValue

											flushSync(() => {
												setValue(newValue)
											})
											onValueChange?.(newValue)
											setOpen(false)
										}}
									>
										{option?.icon} {option.label}
										<CheckIcon
											className={cn(
												'ml-auto h-4 w-4',
												value === option.value
													? 'opacity-100'
													: 'opacity-0',
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	)
}
