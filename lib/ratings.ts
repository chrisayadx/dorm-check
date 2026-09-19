/**
 * The dorms table stores avg_rating, but nothing recalculates it when a review
 * lands, so a building can show a seeded 4.7 directly above its only review, a
 * 2. Where reviews exist they are the honest number, so they win. Where none
 * exist the stored value stands in.
 *
 * The durable fix is a Postgres trigger on reviews that writes dorms.avg_rating.
 * Until that exists, both the grid and the detail page agree by going through here.
 */
export type RatingSummary = { value: number | null; count: number };

export function summarize(
  reviews: { rating: number }[],
  stored?: number | null
): RatingSummary {
  if (reviews.length === 0) {
    return { value: typeof stored === "number" && stored > 0 ? stored : null, count: 0 };
  }
  const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  return { value: total / reviews.length, count: reviews.length };
}

export function groupByDorm(reviews: { dorm_id: string; rating: number }[]) {
  const map = new Map<string, { rating: number }[]>();
  for (const review of reviews) {
    const bucket = map.get(review.dorm_id);
    if (bucket) bucket.push(review);
    else map.set(review.dorm_id, [review]);
  }
  return map;
}
