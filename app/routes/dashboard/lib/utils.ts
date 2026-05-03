export function getMonthRange() {
	const now = new Date()
	const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
	const monthEnd = new Date(
		Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
	)
	return { monthStart, monthEnd }
}
