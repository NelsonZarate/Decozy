// `id` values must match the backend's TOKEN_PACKAGES keys.
export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "5_tokens", credits: 5, price: 10 },
  { id: "10_tokens", credits: 10, price: 15 },
  { id: "15_tokens", credits: 15, price: 20 },
];

export const BEST_VALUE_PACKAGE_ID = "15_tokens";

export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}
