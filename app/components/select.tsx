import { flushSync } from 'react-dom'
import { useState } from 'react'

import {
	Select as ShadcnSelect,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	SelectSeparator,
} from '~/components/ui/select'

type SelectProps = {
	options: Array<{ value: string; label: string; icon?: React.ReactNode }>
	id?: string
	name?: string
	defaultValue?: string
	placeholder?: string
	onValueChange?: (value: string) => void
	clearable?: boolean
}

export function Select({
	options,
	id,
	name,
	defaultValue,
	placeholder,
	onValueChange,
	clearable,
}: SelectProps) {
	const [value, setValue] = useState(defaultValue ?? '')

	return (
		<ShadcnSelect
			name={name}
			value={value}
			onValueChange={selected => {
				const newValue = selected === 'clear' ? '' : selected
				flushSync(() => {
					setValue(newValue)
				})
				onValueChange?.(newValue)
			}}
		>
			<SelectTrigger id={id} className='w-full'>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map(({ value, label, icon }) => (
					<SelectItem key={value} value={value}>
						{icon} {label}
					</SelectItem>
				))}

				{clearable && (
					<>
						<SelectSeparator />
						<SelectItem value='clear'>Clear</SelectItem>
					</>
				)}
			</SelectContent>
		</ShadcnSelect>
	)
}
