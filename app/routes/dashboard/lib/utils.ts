export function getMonthsRange(months = 0) {
	const now = new Date()
	const start = new Date(
		Date.UTC(now.getFullYear(), now.getMonth() + Math.min(months, 0), 1),
	)
	const end = new Date(
		Date.UTC(
			now.getFullYear(),
			now.getMonth() + Math.max(months, 0) + 1,
			0,
		),
	)
	return { monthStart: start, monthEnd: end }
}