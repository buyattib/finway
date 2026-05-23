import { useSearchParams } from 'react-router'

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '~/components/ui/pagination'

type TablePaginationProps = {
	page: number
	pages: number
}

export function TablePagination({ page, pages }: TablePaginationProps) {
	const [searchParams] = useSearchParams()

	if (pages <= 1) return null

	const buildSearch = (p: number) => {
		const params = new URLSearchParams(searchParams)
		params.set('page', String(p))
		return `?${params.toString()}`
	}

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						to={{ search: buildSearch(Math.max(1, page - 1)) }}
					/>
				</PaginationItem>
				{Array.from(Array(pages).keys()).map(v => (
					<PaginationItem key={v}>
						<PaginationLink
							to={{ search: buildSearch(v + 1) }}
							isActive={page === v + 1}
						>
							{v + 1}
						</PaginationLink>
					</PaginationItem>
				))}
				<PaginationItem>
					<PaginationNext
						to={{
							search: buildSearch(Math.min(pages, page + 1)),
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
