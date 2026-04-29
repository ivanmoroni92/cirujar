/**
 * Local images must use require() so Metro bundles them.
 * A string path is not a valid network URI and will not load with source={{ uri: '...' }}.
 * The asset is required from `assets/images/placeholder.ts` so Metro resolves the path reliably.
 */
export { IMAGE_PLACEHOLDER } from './assets/images/placeholder';
