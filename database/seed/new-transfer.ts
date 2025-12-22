import { eq } from 'drizzle-orm'
import { getDb } from './db'
import * as schema from '../schema'

const db = getDb(schema)

const [user] = await db
	.select()
	.from(schema.user)
	.where(eq(schema.user.email, 'buyattib29@gmail.com'))

// const accounts = await db
// 	.select()
// 	.from(schema.account)
// 	.where(eq(schema.account.ownerId, user.id))

const wallets = await db
	.select({ id: schema.wallet.id })
	.from(schema.wallet)
	.innerJoin(schema.account, eq(schema.account.id, schema.wallet.accountId))
	.where(eq(schema.account.ownerId, user.id))

console.log(wallets)

await db.insert(schema.transfer).values({
	date: new Date().toISOString(),
	amount: 100,

	fromWalletId: wallets[0].id,
	toWalletId: wallets[1].id,
})

const transfers = await db.select().from(schema.transfer)
console.log(transfers)
