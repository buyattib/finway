import { useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { LightbulbIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'

const SUGGESTED_CATEGORY_KEYS = [
	'housing',
	'transportation',
	'foodAndGroceries',
	'diningOut',
	'utilities',
	'healthcare',
	'entertainment',
	'shopping',
	'clothing',
	'education',
	'savings',
	'investments',
	'travel',
	'subscriptions',
	'insurance',
	'personalCare',
	'fitness',
	'pets',
	'donations',
	'salary',
	'freelance',
	'gifts',
	'other',
] as const

export function SuggestedCategoriesDialog({
	existingCategoryNames,
}: {
	existingCategoryNames: string[]
}) {
	const { t } = useTranslation('transaction-categories')
	const navigation = useNavigation()
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<Set<string>>(new Set())

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'add-suggestions'

	const existingNamesLower = new Set(
		existingCategoryNames.map(n => n.toLowerCase()),
	)

	function handleToggle(categoryName: string) {
		setSelected(prev => {
			const next = new Set(prev)
			if (next.has(categoryName)) {
				next.delete(categoryName)
			} else {
				next.add(categoryName)
			}
			return next
		})
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='outline'>
					<LightbulbIcon aria-hidden />
					<span className='sm:inline hidden'>
						{t('index.suggestions.triggerButton')}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t('index.suggestions.title')}
					</DialogTitle>
					<DialogDescription>
						{t('index.suggestions.description')}
					</DialogDescription>
				</DialogHeader>

				<Form
					method='post'
					onSubmit={() => {
						setSelected(new Set())
						setOpen(false)
					}}
				>
					<input type='hidden' name='intent' value='add-suggestions' />
					{Array.from(selected).map(name => (
						<input
							key={name}
							type='hidden'
							name='categoryNames'
							value={name}
						/>
					))}

					<div className='grid grid-cols-2 gap-3 max-h-80 overflow-y-auto py-2'>
						{SUGGESTED_CATEGORY_KEYS.map(key => {
							const categoryName = t(
								`index.suggestions.categories.${key}`,
							)
							const alreadyExists = existingNamesLower.has(
								categoryName.toLowerCase(),
							)
							const id = `suggestion-${key}`

							return (
								<div
									key={key}
									className='flex items-center gap-2'
								>
									<Checkbox
										id={id}
										checked={
											alreadyExists || selected.has(categoryName)
										}
										disabled={alreadyExists}
										onCheckedChange={() =>
											handleToggle(categoryName)
										}
									/>
									<Label
										htmlFor={id}
										className={
											alreadyExists
												? 'text-muted-foreground line-through'
												: ''
										}
									>
										{categoryName}
									</Label>
								</div>
							)
						})}
					</div>

					<DialogFooter className='mt-4'>
						<Button
							type='submit'
							disabled={selected.size === 0 || isSubmitting}
							loading={isSubmitting}
						>
							{t('index.suggestions.addButton')}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
