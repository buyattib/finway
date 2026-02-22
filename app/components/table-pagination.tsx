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
	if (pages <= 1) return null

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						prefetch='intent'
						to={{ search: `?page=${page === 1 ? 1 : page - 1}` }}
					/>
				</PaginationItem>
				{Array.from(Array(pages).keys()).map(v => (
					<PaginationItem key={v}>
						<PaginationLink
							prefetch='intent'
							to={{ search: `?page=${v + 1}` }}
							isActive={page === v + 1}
						>
							{v + 1}
						</PaginationLink>
					</PaginationItem>
				))}
				<PaginationItem>
					<PaginationNext
						prefetch='intent'
						to={{
							search: `?page=${page === pages ? pages : page + 1}`,
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
