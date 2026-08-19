export const PRODUCT_SIDES = ["GAUCHE", "DROIT"] as const;
export type ProductSideCode = (typeof PRODUCT_SIDES)[number];

export const PRODUCT_SIDE_LABELS: Record<ProductSideCode, string> = {
  GAUCHE: "Gauche",
  DROIT: "Droit",
};
