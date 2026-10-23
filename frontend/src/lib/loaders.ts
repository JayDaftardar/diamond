import { notFound } from '@tanstack/react-router'
import { fetchRedirect } from '#/lib/api'
import type { EntityType } from '#/lib/types'

/**
 * Called by a route loader when a slug does not exist. If the page was renamed, returns
 * the new slug (the route then answers with a permanent 301 redirect); otherwise throws
 * notFound(), which renders the 404 page with a real 404 status.
 */
export async function newSlugOrNotFound(
  type: EntityType,
  slug: string,
): Promise<string> {
  const newSlug = await fetchRedirect({ data: { type, slug } })
  if (!newSlug) throw notFound()
  return newSlug
}
