import { useId } from 'react'
import {
	useInputControl,
	getInputProps,
	getSelectProps,
	type FieldMetadata,
} from '@conform-to/react'

import { cn, formatNumberWithoutCommas, isValueNumeric } from '~/lib/utils'

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
			<Label
				htmlFor={fieldProps.id}
				aria-invalid={errorId ? true : undefined}
			>
				{label}
			</Label>
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
					className='self-center text-sm text-muted-foreground'
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
	...triggerProps
}: {
	label?: string
	field: FieldMetadata<string>
	items: Array<{ label: string; value: string; icon?: React.ReactNode }>
	placeholder?: string
	className?: string
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

			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
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
					const value = formatNumberWithoutCommas(
						e.target.value,
					).trim()

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
