import { ASSETS_ACCOUNT_TYPES } from './constants'
import type { TAccountType, TAssetAccountType } from './types'

export function isAssetType(
	accountType: TAccountType,
): accountType is TAssetAccountType {
	return ASSETS_ACCOUNT_TYPES.some(t => t === accountType)
}
