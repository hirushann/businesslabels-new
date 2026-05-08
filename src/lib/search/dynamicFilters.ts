export type DynamicFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type DynamicRangeFilter = {
  type: "range";
  key: string;
  field: string;
  label: string;
  name: string;
  min: number;
  max: number;
  unitPrefix?: string;
  unitSuffix?: string;
};

export type DynamicOptionFilter = {
  type: "option";
  key: string;
  field: string;
  label: string;
  options: DynamicFilterOption[];
};

export type DynamicProductFilter = DynamicRangeFilter | DynamicOptionFilter;
