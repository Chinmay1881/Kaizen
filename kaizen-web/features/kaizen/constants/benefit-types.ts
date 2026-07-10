/** Preset "Expected Benefits" options from docs/product/02_PRODUCT_REQUIREMENTS.md (KAIZEN-001, Step 8). Users can also add fully custom ones. */
export const PRESET_BENEFIT_TYPES = [
  { value: "TIME_SAVED", label: "Time Saved" },
  { value: "COST_REDUCTION", label: "Cost Reduction" },
  { value: "CUSTOMER_SATISFACTION", label: "Customer Satisfaction" },
  { value: "SAFETY", label: "Safety" },
  { value: "QUALITY", label: "Quality" },
  { value: "EMPLOYEE_PRODUCTIVITY", label: "Employee Productivity" },
] as const;

/**
 * "Business Impact" and "Estimated Savings" (this milestone's Step 5) don't have dedicated
 * columns anywhere in the schema — `business_impacts` is a separate table populated later, by
 * managers/HR, only after implementation is *actually* completed (see docs/product IMPLEMENT-001),
 * not something an employee estimates at submission time. Rather than add new schema for a single
 * free-text field, these reuse the existing `kaizen_benefits` table as two more entries with fixed
 * type codes, kept distinct from the preset/custom benefit cards above.
 */
export const BUSINESS_IMPACT_TYPE = "BUSINESS_IMPACT";
export const ESTIMATED_SAVINGS_TYPE = "ESTIMATED_SAVINGS";
