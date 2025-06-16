"use client";

import { useEffect, useMemo, useRef } from "react";
import { Field, FormikProps } from "formik";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductTabField } from "@/documents/products";
import { type ChangeEvent, type FocusEvent } from "react";
import { checkDependencyChain } from "@/utils/dependencies";
import { PanjurSelections } from "@/types/panjur";
import Image from "next/image";

interface DynamicFormProps {
  fields: ProductTabField[];
  values: PanjurSelections;
}

type FormValues = Record<string, string | number | boolean>;

interface FormikInputProps {
  field: {
    name: string;
    value: string | number | boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  };
  form: FormikProps<FormValues>;
  fieldDef: ProductTabField;
}

const TextInput: React.FC<FormikInputProps> = ({ field, fieldDef }) => (
  <Input
    id={fieldDef.id}
    value={(field.value as string) || ""}
    onChange={field.onChange}
    onBlur={field.onBlur}
    name={field.name}
    disabled={fieldDef.disabled}
  />
);

const NumberInput: React.FC<FormikInputProps> = ({ field, form, fieldDef }) => (
  <Input
    id={fieldDef.id}
    type="number"
    value={(field.value as number) || 0}
    onChange={(e) => {
      const numValue = parseFloat(e.target.value);
      if (!isNaN(numValue)) {
        form.setFieldValue(field.name, numValue);
      }
    }}
    onBlur={(e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        if (fieldDef.min !== undefined && value < fieldDef.min) {
          form.setFieldValue(field.name, fieldDef.min);
        } else if (fieldDef.max !== undefined && value > fieldDef.max) {
          form.setFieldValue(field.name, fieldDef.max);
        }
      }
      field.onBlur(e);
    }}
    min={fieldDef.min}
    max={fieldDef.max}
    name={field.name}
    disabled={fieldDef.disabled}
  />
);

const SelectInput: React.FC<
  FormikInputProps & { allFields?: ProductTabField[] }
> = ({ field, form, fieldDef, allFields }) => {
  const { values } = form;

  const filteredOptions = useMemo(() => {
    if (!fieldDef.options) return [];
    let options = [...fieldDef.options];

    if (fieldDef.filterBy) {
      const filters = Array.isArray(fieldDef.filterBy)
        ? fieldDef.filterBy
        : [fieldDef.filterBy];

      options = filters.reduce((filteredOpts, filter) => {
        // ValueMap filtresi
        const filterValue = values[filter.field]?.toString();
        if (filterValue && filter.valueMap && filter.valueMap[filterValue]) {
          return filteredOpts.filter((option) => {
            const optionId = option.id || option.name;
            return filter.valueMap?.[filterValue].includes(optionId);
          });
        }

        // CustomFilter kontrolü
        // if (filter.field === "customFilter" && filter.properties) {
        //   if (fieldDef.id === "lamelTickness") {
        //     const width = Number(values["width"]) || 0;
        //     const height = Number(values["height"]) || 0;
        //     const area = (width * height) / 1_000_000;
        //     return filteredOpts.filter((option) => {
        //       const optionId = option.id || option.name;
        //       const properties = filter.properties?.[optionId] as
        //         | LamelProperties
        //         | undefined;

        //       if (properties) {
        //         const withinArea =
        //           !properties.maxArea || area <= properties.maxArea;
        //         const withinMaxWidth =
        //           !properties.maxWidth || width <= properties.maxWidth;
        //         const withinMaxHeight =
        //           !properties.maxHeight || height <= properties.maxHeight;
        //         return (withinMaxWidth && withinMaxHeight) || withinArea;
        //       }
        //       return true;
        //     });
        //   }
        // }
        return filteredOpts;
      }, options);
    }

    return options;
  }, [fieldDef.options, fieldDef.filterBy, values]);

  // Handle default value and first option selection after filtering
  const currentValue = field.value?.toString() ?? "";
  const isCurrentValueInOptions = filteredOptions.some(
    (opt) => (opt.id || opt.name) === currentValue
  );

  useEffect(() => {
    if (filteredOptions.length === 0) return;

    // Eğer sadece 1 seçenek kaldıysa otomatik olarak onu seç
    if (filteredOptions.length === 1) {
      const onlyOption = filteredOptions[0];
      const onlyOptionValue = onlyOption.id || onlyOption.name;
      if (currentValue !== onlyOptionValue) {
        Promise.resolve().then(() => {
          form.setFieldValue(field.name, onlyOptionValue, false);
        });
      }
      return;
    }

    // Birden fazla seçenek varsa ve mevcut seçim geçerli değilse ilk seçeneği seç
    if (!isCurrentValueInOptions) {
      const firstOption = filteredOptions[0];
      const firstOptionValue = firstOption.id || firstOption.name;
      Promise.resolve().then(() => {
        form.setFieldValue(field.name, firstOptionValue, false);
      });
    }
  }, [
    filteredOptions,
    currentValue,
    isCurrentValueInOptions,
    field.name,
    form,
  ]);

  const handleChange = (newValue: string) => {
    form.setFieldValue(field.name, newValue, false);

    if (field.name === "lamel_color" && allFields) {
      // Find all color fields except lamel_color
      const colorFields = ["box_color", "subPart_color", "dikme_color"];

      // Update each color field
      colorFields.forEach((colorField: string) => {
        const fieldDef = allFields.find((f) => f.id === colorField);
        if (!fieldDef?.options) return;

        // Check if the selected lamel_color exists in the current field's options
        const hasColor = fieldDef.options.some(
          (option) => option.id === newValue || option.name === newValue
        );

        // Set the new value based on whether the color exists in options
        const newValueToChange = hasColor ? newValue : "ral_boyali";
        form.setFieldValue(colorField, newValueToChange, false);
      });
    }
  };

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      name={field.name}
      disabled={fieldDef.disabled}
    >
      <SelectTrigger className="w-full" disabled={fieldDef.disabled}>
        <SelectValue placeholder={fieldDef.name} />
      </SelectTrigger>
      <SelectContent>
        {filteredOptions.map((option) => (
          <SelectItem
            key={option.id || option.name}
            value={option.id || option.name}
          >
            <div className="flex items-center space-x-2">
              {option.image && (
                <Image
                  src={option.image}
                  alt={option.name}
                  width={24}
                  height={24}
                  className="object-contain rounded"
                  style={{ minWidth: 24, minHeight: 24 }}
                />
              )}
              <span>{option.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const RadioInput: React.FC<FormikInputProps> = ({ field, form, fieldDef }) => {
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (
      isFirstMountRef.current &&
      fieldDef.default !== undefined &&
      !field.value
    ) {
      isFirstMountRef.current = false;
      form.setFieldValue(field.name, String(fieldDef.default), false);
    }
  }, [field.value, field.name, fieldDef.default, form]);

  if (!fieldDef.options) return null;

  const currentValue = field.value?.toString() ?? "";

  return (
    <RadioGroup
      value={currentValue}
      onValueChange={(value) => {
        form.setFieldValue(field.name, value);
        form.setFieldTouched(field.name, true, false);
      }}
      className="flex flex-col space-y-2"
      name={field.name}
      disabled={fieldDef.disabled}
    >
      {fieldDef.options.map((option) => (
        <div
          key={option.id || option.name}
          className="flex items-center space-x-2"
        >
          <RadioGroupItem
            value={option.id || option.name}
            id={`${fieldDef.id}-${option.id || option.name}`}
          />
          <Label htmlFor={`${fieldDef.id}-${option.id || option.name}`}>
            {option.name}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

const CheckboxInput: React.FC<FormikInputProps> = ({
  field,
  form,
  fieldDef,
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={fieldDef.id}
      checked={!!field.value}
      onCheckedChange={(checked) => form.setFieldValue(field.name, !!checked)}
      name={field.name}
      disabled={fieldDef.disabled}
    />
    <Label htmlFor={fieldDef.id}>{fieldDef.name}</Label>
  </div>
);

const FormikInputs = (
  props: FormikInputProps & { allFields?: ProductTabField[] }
) => {
  switch (props.fieldDef.type) {
    case "text":
      return <TextInput {...props} />;
    case "number":
      return <NumberInput {...props} />;
    case "select":
      return <SelectInput {...props} allFields={props.allFields} />;
    case "radio":
      return <RadioInput {...props} />;
    case "checkbox":
      return <CheckboxInput {...props} />;
    default:
      return null;
  }
};

export function DynamicForm({ fields, values }: DynamicFormProps) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const isVisible = checkDependencyChain(field, values, fields);

        if (!isVisible) {
          // Reset the value of the field if it becomes invisible
          (values as unknown as Record<string, string>)[field.id] = "";
          return null;
        }

        return (
          <div key={field.id} className="space-y-2">
            {field.type !== "checkbox" && (
              <Label htmlFor={field.id}>{field.name}</Label>
            )}
            <Field
              name={field.id}
              component={FormikInputs}
              fieldDef={field}
              allFields={fields}
            />
          </div>
        );
      })}
    </div>
  );
}
