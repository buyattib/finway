export type Beautify<T> = {
	[K in keyof T]: T[K]
} & {}
