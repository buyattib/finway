import { CATEGORY_COLORS } from './constants'

export function getCategoryColor(index: number): string {
	return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
