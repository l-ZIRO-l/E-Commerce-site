// Business rules (see VAULT_00/VAULT_01): prices include GST; flat shipping.
export const SHIPPING_PAISAE = 9900 // ₹99
export const FREE_SHIPPING_ABOVE_PAISE = 149900 // ₹1,499

export function shippingFor(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0
  return subtotalPaise >= FREE_SHIPPING_ABOVE_PAISE ? 0 : SHIPPING_PAISAE
}
