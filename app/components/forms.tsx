import { useId, useState } from 'react'
import {
	useInputControl,
	getInputProps,
	getSelectProps,
	type FieldMetadata,
} from '@conform-to/react'
import { PlusCircleIcon, CalendarIcon, ChevronsUpDownIcon } from 'lucide-react'

import { cn, removeCommas, isValueNumeric, formatDate } from '~/lib/utils'

import { Label } from './ui/label'
import { Input } from './ui/input'
import { Checkbox, type CheckboxProps } from './ui/checkbox'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	type SelectTriggerProps,
} from './ui/select'
import { Button } from './ui/button'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Calendar } from './ui/calendar'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './ui/command'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
	size = 'xs',
}: {
	errors?: ListOfErrors
	id?: string
	size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null

	return (
		<ul id={id} className='flex flex-col gap-1'>
			{errorsToRender.map(e => (
				<li
					key={e}
					className={cn('text-destructive/80', {
						'text-xs': size === 'xs',
						'text-sm': size === 'sm',
						'text-base': size === 'md',
						'text-lg': size === 'lg',
					})}
				>
					{e}
				</li>
			))}
		</ul>
	)
}

export function TextField({
	field,
	label,
	className,
	type = 'text',
	...inputProps
}: {
	field: FieldMetadata<string | null>
	label?: string
	className?: string
	type?: 'text' | 'email' | 'password'
} & React.InputHTMLAttributes<HTMLInputElement>) {
	const errors = field.errors as ListOfErrors
	const fieldProps = getInputProps(field, { type })

	const errorId = errors?.length ? `${fieldProps.id}-error` : undefined

	const props = { ...inputProps, ...fieldProps }

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			{label && (
				<Label
					htmlFor={fieldProps.id}
					aria-invalid={errorId ? true : undefined}
				>
					{label}
				</Label>
			)}
			<Input
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...props}
			/>
			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	label,
	field,
	className,
	...checkboxProps
}: {
	label?: string
	field: FieldMetadata<boolean>
	className?: string
} & Omit<CheckboxProps, 'type'>) {
	const fallbackId = useId()
	const fieldProps = getInputProps(field, { type: 'checkbox' })
	const errors = field.errors as ListOfErrors

	const id = fieldProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const checkedValue = fieldProps.value ?? 'on'

	const control = useInputControl({
		key: fieldProps.key,
		name: fieldProps.name,
		formId: fieldProps.form,
		initialValue: fieldProps.defaultChecked ? checkedValue : undefined,
	})

	const props = { ...checkboxProps, ...fieldProps, id }

	return (
		<div className={cn('flex flex-col w-full', className)}>
			<div className='flex items-center gap-2'>
				<Checkbox
					{...props}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={control.value === checkedValue}
					onCheckedChange={state => {
						control.change(state.valueOf() ? checkedValue : '')
						checkboxProps.onCheckedChange?.(state)
					}}
					onFocus={event => {
						control.focus()
						checkboxProps.onFocus?.(event)
					}}
					onBlur={event => {
						control.blur()
						checkboxProps.onBlur?.(event)
					}}
					type='button'
				/>
				<Label
					htmlFor={id}
					aria-invalid={errorId ? true : undefined}
					className='self-center text-sm text-muted-foreground hover:cursor-pointer'
				>
					{label}
				</Label>
			</div>
			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SelectField({
	label,
	field,
	items,
	placeholder,
	className,
	hideErrors,
	...triggerProps
}: {
	label?: string
	field: FieldMetadata<string>
	items: Array<{ label: string; value: string; icon?: React.ReactNode }>
	placeholder?: string
	className?: string
	hideErrors?: boolean
} & SelectTriggerProps) {
	const fallbackId = useId()
	const fieldProps = getSelectProps(field)
	const errors = field.errors as ListOfErrors

	const id = fieldProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const control = useInputControl({
		key: fieldProps.key,
		name: fieldProps.name,
		formId: fieldProps.form,
		initialValue: fieldProps.defaultValue
			? String(fieldProps.defaultValue)
			: '',
	})

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label htmlFor={id} aria-invalid={errorId ? true : undefined}>
				{label}
			</Label>
			<Select
				disabled={triggerProps.disabled}
				value={control.value}
				onValueChange={value => control.change(value)}
				onOpenChange={open => {
					if (!open) control.blur()
				}}
			>
				<SelectTrigger
					{...triggerProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					onFocus={control.focus}
					onBlur={control.blur}
					className='w-full'
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent id={id}>
					{items.map(item => (
						<SelectItem key={item.value} value={item.value}>
							{item.icon} {item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{!hideErrors && (
				<div className='min-h-6 py-1 px-1'>
					{errorId ? (
						<ErrorList id={errorId} errors={errors} />
					) : null}
				</div>
			)}
		</div>
	)
}

export function ComboboxField({
	field,
	items,
	label,
	buttonPlaceholder,
	inputPlaceholder,
	emptyPlaceholder,
	disabled,
	className,
	hideErrors,
}: {
	field: FieldMetadata<string>
	items: Array<{ value: string; label: string; icon?: React.ReactNode }>
	label?: string
	buttonPlaceholder?: string
	inputPlaceholder?: string
	emptyPlaceholder?: string
	disabled?: boolean
	className?: string
	hideErrors?: boolean
}) {
	const [open, setOpen] = useState(false)

	const fallbackId = useId()
	const fieldProps = getSelectProps(field)
	const errors = field.errors as ListOfErrors

	const id = fieldProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const control = useInputControl({
		key: fieldProps.key,
		name: fieldProps.name,
		formId: fieldProps.form,
		initialValue: fieldProps.defaultValue
			? String(fieldProps.defaultValue)
			: '',
	})

	const selected = items.find(item => item.value === control.value)
	const buttonDisplay = selected ? (
		<div className='flex items-center gap-2'>
			{selected.icon} {selected.label}
		</div>
	) : (
		buttonPlaceholder
	)

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label htmlFor={id} aria-invalid={errorId ? true : undefined}>
				{label}
			</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						name={fieldProps.name}
						value={control.value}
						variant='outline'
						role='combobox'
						aria-expanded={open}
						className={cn('justify-between', {
							'text-muted-foreground': !selected,
						})}
						disabled={disabled}
						aria-invalid={errorId ? true : undefined}
						aria-describedby={errorId}
						width='full'
					>
						{buttonDisplay}
						<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className={cn('p-0')}>
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
										keywords={[item.label.toLowerCase()]}
										onSelect={value => {
											control.change(value)
											setOpen(false)
										}}
									>
										{item?.icon} {item.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{!hideErrors && (
				<div className='min-h-6 py-1 px-1'>
					{errorId ? (
						<ErrorList id={errorId} errors={errors} />
					) : null}
				</div>
			)}
		</div>
	)
}

export function NumberField({
	label,
	field,
	className,
	...inputProps
}: {
	label?: string
	field: FieldMetadata<string>
	className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
	const fallbackId = useId()
	const fieldProps = getInputProps(field, { type: 'text' })
	const errors = field.errors as ListOfErrors

	const id = fieldProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const { defaultValue, ...rest } = fieldProps
	const props = { ...inputProps, ...rest, id }

	const control = useInputControl<string>({
		key: fieldProps.key,
		name: fieldProps.name,
		formId: fieldProps.form,
		initialValue: defaultValue,
	})

	function formatNumberWithCommas(value: string | undefined) {
		if (!value) return ''

		const [integerPart, decimalPart] = value.split('.')

		const formattedInteger = integerPart.replace(
			/\B(?=(\d{3})+(?!\d))/g,
			',',
		)

		return decimalPart !== undefined
			? `${formattedInteger}.${decimalPart}`
			: formattedInteger
	}

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label htmlFor={id} aria-invalid={errorId ? true : undefined}>
				{label}
			</Label>
			<Input
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				inputMode='numeric'
				{...props}
				value={formatNumberWithCommas(control.value)}
				onChange={e => {
					const value = removeCommas(e.target.value).trim()

					if (!isValueNumeric(value)) return
					if (
						value.length > 1 &&
						value[0] === '0' &&
						value[1] !== '.'
					) {
						return
					}

					control.change(value)
				}}
			/>
			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function UploadField({
	field,
	label,
	className,
	...inputProps
}: {
	field: FieldMetadata<File | null>
	label?: string
	className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
	const errors = field.errors as ListOfErrors
	const fieldProps = getInputProps(field, { type: 'file' })

	const props = { ...inputProps, ...fieldProps }

	const errorId = errors?.length ? `${props.id}-error` : undefined

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label
				htmlFor={fieldProps.id}
				className='p-2 bg-muted-foreground/20 rounded-lg cursor-pointer justify-center text-sm'
				aria-invalid={errorId ? true : undefined}
			>
				<PlusCircleIcon className='w-5 h-5' />
				{label}
			</Label>
			<Input
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				aria-label='Image'
				accept='image/*'
				className='hidden'
				{...props}
			/>

			{errorId ? (
				<div className='py-1 px-1'>
					<ErrorList id={errorId} errors={errors} />
				</div>
			) : null}
		</div>
	)
}

export function DateField({
	field,
	label,
	placeholder,
	className,
	disabled,
}: {
	field: FieldMetadata<string>
	label?: string
	placeholder?: string
	className?: string
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)

	const errors = field.errors as ListOfErrors
	const fieldProps = getInputProps(field, { type: 'date' })

	const errorId = errors?.length ? `${fieldProps.id}-error` : undefined

	const control = useInputControl({
		key: fieldProps.key,
		name: fieldProps.name,
		formId: fieldProps.form,
		initialValue: fieldProps.defaultValue,
	})

	const dateValue = control.value ? new Date(control.value) : undefined

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			{label && (
				<Label
					htmlFor={fieldProps.id}
					aria-invalid={errorId ? true : undefined}
				>
					{label}
				</Label>
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={fieldProps.id}
						name={field.name}
						value={control.value}
						disabled={disabled}
						aria-disabled={disabled}
						data-empty={!control.value}
						aria-invalid={errorId ? true : undefined}
						aria-describedby={errorId}
						variant='outline'
						className={cn('justify-start', {
							'ring-destructive/20 dark:ring-destructive/40 border-destructive':
								!!errorId,
							'text-muted-foreground': !control.value,
						})}
					>
						<CalendarIcon />
						{dateValue ? formatDate(dateValue) : placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0'>
					<Calendar
						mode='single'
						selected={dateValue}
						onSelect={date => {
							if (!date) return
							control.change(date.toISOString())
							setOpen(false)
						}}
					/>
				</PopoverContent>
			</Popover>

			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
