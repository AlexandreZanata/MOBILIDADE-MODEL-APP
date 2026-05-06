import { z } from 'zod';

export const autocompleteItemSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough();

export const autocompleteItemsSchema = z.array(autocompleteItemSchema);
