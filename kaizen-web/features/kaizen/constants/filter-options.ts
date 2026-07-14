import { KAIZEN_PRIORITIES, KAIZEN_PRIORITY_LABELS } from "@/constants/kaizen-priority";
import { KAIZEN_STATUS_LABELS } from "@/constants/kaizen-status";

export const STATUS_FILTER_OPTIONS = Object.entries(KAIZEN_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const PRIORITY_FILTER_OPTIONS = KAIZEN_PRIORITIES.map((value) => ({
  value,
  label: KAIZEN_PRIORITY_LABELS[value],
}));
