// In-memory review notes on journal entries for the page load (decisions 33 and 37).

const reviews = new Map<string, { note: string; at: string }>();

export const getReviews = (): ReadonlyMap<string, { note: string; at: string }> => reviews;

export const setReview = (id: string, review: { note: string; at: string }): void => {
  reviews.set(id, review);
};
