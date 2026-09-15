// Generic Brand helper for nominal/branded types (standards 6.4).
// Prevents accidental mixing of identifiers, currency amounts, percentages and timestamps.

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };
