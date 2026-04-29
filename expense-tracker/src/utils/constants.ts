export enum FilterEnum {
  TODAY = "today",
  YESTERDAY = "yesterday",
  PAST_WEEK = "past_week",
  PAST_MONTH = "past_month",
  LAST_3_MONTHS = "last_3_months",
  CUSTOM = "custom",
}

export enum SortOptionEnum {
  A_Z = "a-z",
  Z_A = "z-a",
  AMOUNT_HIGH = "amount_high",
  AMOUNT_LOW = "amount_low",
  NEWEST_DATE = "newest_date",
  OLDEST_DATE = "oldest_date",
}

export const SORT_OPTIONS: Record<SortOptionEnum, Record<string, 1 | -1>> = {
  [SortOptionEnum.A_Z]: { description: 1 },
  [SortOptionEnum.Z_A]: { description: -1 },
  [SortOptionEnum.AMOUNT_HIGH]: { amount: -1 },
  [SortOptionEnum.AMOUNT_LOW]: { amount: 1 },
  [SortOptionEnum.NEWEST_DATE]: { createdAt: -1 },
  [SortOptionEnum.OLDEST_DATE]: { createdAt: 1 },
};
