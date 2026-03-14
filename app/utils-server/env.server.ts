import { z } from 'zod'
import { STAGE_DEVELOPMENT, STAGE_PRODUCTION } from '~/lib/constants'

const schema = z.object({
	stage: z.enum([STAGE_PRODUCTION, STAGE_DEVELOPMENT] as const),

	SESSION_SECRET: z.string(),
	HONEYPOT_SECRET: z.string(),
	MAGIC_LINK_SECRET: z.string(),

	FINWAY_EMAIL: z.string(),
	RESEND_API_KEY: z.string(),

	DB_FILE_NAME: z.string(),
	TURSO_AUTH_TOKEN: z.string().optional(),
})

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface ProcessEnv extends z.infer<typeof schema> {}
	}
}

export const env = schema.parse({
	stage: process.env.NODE_ENV,
	...process.env,
})
