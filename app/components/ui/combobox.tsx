import * as React from 'react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'

export type ComboboxProps = {
	items: Array<{ value: string; label: string; icon?: React.ReactNode }>
	value: string
	onValueChange: (value: string) => void
	buttonPlaceholder?: string
	inputPlaceholder?: string
	emptyPlaceholder?: string
}

export function Combobox({
	items,
	value,
	onValueChange,
	buttonPlaceholder,
	inputPlaceholder,
	emptyPlaceholder,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false)

	const buttonDisplay = value
		? items.find(item => item.value === value)?.label
		: buttonPlaceholder

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					role='combobox'
					aria-expanded={open}
					className='justify-between'
				>
					{buttonDisplay}
					<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className=''>
				<Command>
					<CommandInput placeholder={inputPlaceholder} />
					<CommandList>
						<CommandEmpty>
							{emptyPlaceholder ?? 'No results found'}
						</CommandEmpty>
						<CommandGroup>
							{items.map(item => (
								<CommandItem
									key={item.value}
									value={item.value}
									onSelect={currentValue => {
										onValueChange(
											currentValue === value
												? ''
												: currentValue,
										)
										setOpen(false)
									}}
								>
									<CheckIcon
										className={cn(
											'mr-2 h-4 w-4',
											value === item.value
												? 'opacity-100'
												: 'opacity-0',
										)}
									/>
									{item?.icon} {item.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
