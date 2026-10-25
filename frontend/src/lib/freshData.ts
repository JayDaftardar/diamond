/**
 * Route options for the admin: never reuse a page's data from an earlier visit.
 *
 * By default the router keeps a page's data for a while and shows it again straight away
 * (refreshing in the background). In the admin that is wrong: a form starts from the data it
 * is given, so coming back to a treatment after saving it would show, and could then save
 * over, the version from before. With these options every visit loads the data afresh.
 */
export const freshData = {
  staleTime: 0,
  gcTime: 0,
  preloadStaleTime: 0,
  preloadGcTime: 0,
} as const
