/**
 * @file components/index.ts
 * @description Root barrel export for the entire component library.
 * Import from this file when you need components across multiple layers.
 *
 * Prefer layer-specific imports for clarity:
 *   import { Button } from '@/components/atoms';
 *   import { Modal } from '@/components/molecules';
 *   import { ChatWindow } from '@/components/organisms';
 */

export * from './atoms';
export * from './molecules';
export * from './organisms';
