export interface Option {
  id: string;
  name: string;
}

export interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  options?: Option[];
  defaultValue?: string | number;
  required?: boolean;
}

export interface TabContent {
  fields?: Field[];
}

export interface Tab {
  id: string;
  label: string;
  content?: TabContent;
  typeId?: string;
  optionId?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  tabs: Tab[];
}
