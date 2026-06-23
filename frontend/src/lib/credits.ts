// Credit (token) package definitions.
//
// The `id` values MUST match the backend's TOKEN_PACKAGES keys
// (see backend `app/api/v1/routers/tokens.py`), since the purchase request
// sends this id and the backend is the source of truth for pricing.

export interface CreditPackage {
  id: string;
  /** Number of credits granted by this package. */
  credits: number;
  /** Price in euros. */
  price: number;
}

/** Available credit packages offered in the purchase menu. */
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "5_tokens", credits: 5, price: 10 },
  { id: "10_tokens", credits: 10, price: 15 },
  { id: "15_tokens", credits: 15, price: 20 },
];

/** The package highlighted as the best value in the UI. */
export const BEST_VALUE_PACKAGE_ID = "15_tokens";

/** Look up a package by its id. Returns `undefined` when not found. */
export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}
