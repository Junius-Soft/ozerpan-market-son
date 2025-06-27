"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Field, FormikProps } from "formik";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Checkbox } from "@/components/ui/checkbox";
import { ProductTabField } from "@/documents/products";
import { type ChangeEvent, type FocusEvent } from "react";
import { checkDependencyChain } from "@/utils/dependencies";
import { PanjurSelections } from "@/types/panjur";
import Image from "next/image";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { useFilterBoxSize } from "../hooks/form-rules/useFilterBoxSize";

interface DynamicFormProps {
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >;
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
  FormikInputProps & {
    allFields?: ProductTabField[];
    formik: FormikProps<
      PanjurSelections & Record<string, string | number | boolean>
    >;
  }
> = ({ field, form, fieldDef, allFields, formik }) => {
  const { values } = form;
  const [open, setOpen] = useState(false);
  const { validBoxOptions } = useFilterBoxSize(formik);

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

        return filteredOpts;
      }, options);
    }

    return options;
  }, [fieldDef.options, fieldDef.filterBy, values]);

  const currentValue = field.value?.toString() ?? "";
  const selectedOption = filteredOptions.find(
    (opt) => (opt.id || opt.name) === currentValue
  );

  const handleSelect = (optionValue: string) => {
    form.setFieldValue(field.name, optionValue, false);
    // lamel_color seçildiyse diğer renk alanını da güncelle
    if (field.name === "lamel_color" && allFields) {
      const colorFields = ["box_color", "subPart_color", "dikme_color"];
      colorFields.forEach((colorField: string) => {
        const colorFieldDef = allFields.find((f) => f.id === colorField);
        if (!colorFieldDef?.options) return;
        const hasColor = colorFieldDef.options.some(
          (option) => option.id === optionValue || option.name === optionValue
        );
        const newValueToChange = hasColor ? optionValue : "ral_boyalı";
        form.setFieldValue(colorField, newValueToChange, false);
      });
    }
    if (field.name === "boxType" && validBoxOptions) {
      const isValidOption = validBoxOptions.some(
        (opt) => opt.id === optionValue
      );
      if (!isValidOption) {
        form.setFieldValue("boxType", validBoxOptions[0].id, false);
      }
    }
    setOpen(false);
  };

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

  // Eğer sadece 1 seçenek varsa, butonu disabled yap ve modal açılmasın
  const isSingleOption = filteredOptions.length === 1;

  // Yardımcı fonksiyon: Arka plan rengine göre uygun text rengi seç (siyah/beyaz)
  function getContrastTextColor(bgColor: string): string {
    // Hex kodunu temizle
    const hex = bgColor.replace("#", "");
    // Kısa hex (#abc) -> uzun hex (#aabbcc)
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((x) => x + x)
            .join("")
        : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    // Luminance hesapla
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#222" : "#fff";
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={`w-full flex items-center border rounded-md px-3 py-2 min-h-[44px] transition ${
            isSingleOption || fieldDef.disabled
              ? "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
              : "bg-background hover:bg-muted"
          }`}
          onClick={() => {
            if (!isSingleOption) setOpen(true);
          }}
          disabled={isSingleOption || fieldDef.disabled}
          style={(() => {
            // Seçili option'da color varsa uygula
            if (selectedOption?.color) {
              return {
                backgroundColor: selectedOption.color,
                color: getContrastTextColor(selectedOption.color),
              };
            }
            // Eğer field id'si ..._color ile bitiyorsa ve seçili option yoksa, mevcut value'ya karşılık gelen option'u bul
            if (fieldDef.id.endsWith("_color")) {
              const currentOpt = filteredOptions.find(
                (opt) => (opt.id || opt.name) === currentValue
              );
              if (currentOpt?.color) {
                return {
                  backgroundColor: currentOpt.color,
                  color: getContrastTextColor(currentOpt.color),
                };
              }
            }
            return {};
          })()}
        >
          {selectedOption?.image && (
            <Image
              src={selectedOption.image}
              alt={selectedOption.name}
              width={32}
              height={32}
              className="object-contain rounded mr-2"
            />
          )}
          <span className="truncate">
            {selectedOption?.name || fieldDef.name}
          </span>
        </button>
      }
      title={fieldDef.name}
      showTitle={true}
    >
      <div className="grid grid-cols-2 gap-4">
        {filteredOptions.map((option) => {
          const hasColor = !!option.color;
          const style =
            hasColor && option.color
              ? {
                  backgroundColor: option.color,
                  color: getContrastTextColor(option.color),
                }
              : {};
          return (
            <button
              key={option.id || option.name}
              type="button"
              className={`flex flex-col items-center justify-center border rounded-lg p-2 transition hover:border-blue-500 focus:outline-none ${
                (option.id || option.name) === currentValue
                  ? "border-blue-500 ring-2 ring-blue-300"
                  : "border-muted"
              }`}
              onClick={() => handleSelect(option.id || option.name)}
              tabIndex={0}
              autoFocus={false}
              style={style}
            >
              {option.image && (
                <Image
                  src={option.image}
                  alt={option.name}
                  width={96}
                  height={96}
                  className="object-contain rounded mb-2"
                />
              )}
              <span className="text-center font-medium break-words max-w-[140px]">
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    </CustomDialog>
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
  props: FormikInputProps & {
    allFields?: ProductTabField[];
    formik: FormikProps<
      PanjurSelections & Record<string, string | number | boolean>
    >;
  }
) => {
  switch (props.fieldDef.type) {
    case "text":
      return <TextInput {...props} />;
    case "number":
      return <NumberInput {...props} />;
    case "select":
      return (
        <SelectInput
          {...props}
          allFields={props.allFields}
          formik={props.formik}
        />
      );
    case "radio":
      return <RadioInput {...props} />;
    case "checkbox":
      return <CheckboxInput {...props} />;
    default:
      return null;
  }
};

export function DynamicForm({ formik, fields, values }: DynamicFormProps) {
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
              formik={formik}
            />
          </div>
        );
      })}
    </div>
  );
}
