import { z } from 'zod'

const schema = z.object({
	NODE_ENV: z.enum(['production', 'development', 'test'] as const),
	DB_FILE_NAME: z.string(),
	SESSION_SECRET: z.string(),
	HONEYPOT_SECRET: z.string(),
	MAGIC_LINK_SECRET: z.string(),
})

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof schema> {}
	}
}

export const env = schema.parse(process.env)
