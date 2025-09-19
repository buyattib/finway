import { useId } from 'react'
import { useInputControl } from '@conform-to/react'

import { cn } from '~/lib/utils'

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
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null

	return (
		<ul id={id} className='flex flex-col gap-1'>
			{errorsToRender.map(e => (
				<li key={e} className='text-destructive/80 text-xs'>
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label
				htmlFor={id}
				aria-invalid={errorId ? true : undefined}
				{...labelProps}
			/>
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	checkboxProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	checkboxProps: Omit<CheckboxProps, 'type'> & {
		type?: string
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = checkboxProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const checkedValue = checkboxProps.value ?? 'on'

	const control = useInputControl({
		key: checkboxProps.key,
		name: checkboxProps.name,
		formId: checkboxProps.form,
		initialValue: checkboxProps.defaultChecked ? checkedValue : undefined,
	})

	return (
		<div className={cn('flex flex-col w-full', className)}>
			<div className='flex items-center gap-2'>
				<Checkbox
					{...checkboxProps}
					id={id}
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
					{...labelProps}
					className='self-center text-sm text-muted-foreground'
				/>
			</div>
			<div className='min-h-6 py-1 px-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SelectField({
	labelProps,
	selectProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	selectProps: SelectTriggerProps & {
		name: string
		form: string
		items: Array<{ label: string; value: string }>
		placeholder?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = selectProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	const { name, form, defaultValue, placeholder, items, ...triggerProps } =
		selectProps

	const control = useInputControl({
		key: triggerProps.key,
		name: name,
		formId: form,
		initialValue: defaultValue ? String(defaultValue) : undefined,
	})

	return (
		<div className={cn('flex flex-col gap-1 w-full', className)}>
			<Label
				htmlFor={id}
				aria-invalid={errorId ? true : undefined}
				{...labelProps}
			/>
			<Select
				value={control.value}
				onValueChange={value => control.change(value)}
				onOpenChange={open => {
					if (!open) control.blur()
				}}
				disabled={triggerProps.disabled}
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
							{item.label}
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
