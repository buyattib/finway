import { getSelectData } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'
import type { DB } from '~/lib/types'

import { getTransactions } from '~/routes/transactions/lib/queries'
import type {
	TCategory,
	TTransactionType,
} from '~/routes/transactions/lib/types'
import { getTransfers } from '~/routes/transfers/lib/queries'
import { getExchanges } from '~/routes/exchanges/lib/queries'

export async function getTransactionsTabData({
	db,
	ownerId,
	searchParams,
}: {
	db: DB
	ownerId: string
	searchParams: URLSearchParams
}) {
	const page = Number(searchParams.get('page') ?? '1')

	const filters = {
		accountId: searchParams.get('accountId') ?? '',
		currencyId: searchParams.get('currencyId') ?? '',
		category: (searchParams.get('category') as TCategory) ?? '',
		transactionType:
			(searchParams.get('transactionType') as TTransactionType) ?? '',
	}

	const [{ transactions, pagination }, selectData] = await Promise.all([
		getTransactions({ db, ownerId, page, ...filters }),
		getSelectData(db, ownerId),
	])

	return { transactions, pagination, filters, selectData }
}

export async function getTransfersTabData({
	db,
	ownerId,
	searchParams,
}: {
	db: DB
	ownerId: string
	searchParams: URLSearchParams
}) {
	const page = Number(searchParams.get('page') ?? '1')

	const filters = {
		fromAccountId: searchParams.get('fromAccountId') ?? '',
		toAccountId: searchParams.get('toAccountId') ?? '',
		currencyId: searchParams.get('currencyId') ?? '',
	}

	const [{ transfers, total }, selectData] = await Promise.all([
		getTransfers({ db, ownerId, page, ...filters }),
		getSelectData(db, ownerId),
	])

	return {
		transfers,
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
		filters,
		selectData,
	}
}

export async function getExchangesTabData({
	db,
	ownerId,
	searchParams,
}: {
	db: DB
	ownerId: string
	searchParams: URLSearchParams
}) {
	const page = Number(searchParams.get('page') ?? '1')

	const filters = {
		accountId: searchParams.get('accountId') ?? '',
		fromCurrencyId: searchParams.get('fromCurrencyId') ?? '',
		toCurrencyId: searchParams.get('toCurrencyId') ?? '',
	}

	const [{ exchanges, total }, selectData] = await Promise.all([
		getExchanges({ db, ownerId, page, ...filters }),
		getSelectData(db, ownerId),
	])

	return {
		exchanges,
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
		filters,
		selectData,
	}
}
