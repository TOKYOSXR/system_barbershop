/**
 * Computes a barber commission from a service price and a percentage,
 * rounded to cents. Pure so it can be unit tested and reused.
 */
export function calcCommission(price: number, percentage: number): number {
  return Math.round(((price * percentage) / 100) * 100) / 100;
}
