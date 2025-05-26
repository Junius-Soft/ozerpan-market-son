"use client";

import { useEffect, useMemo, useRef } from "react";
import { Formik, Form, Field, useFormikContext, FormikProps } from "formik";
import * as Yup from "yup";
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

interface DynamicFormProps {
  fields: ProductTabField[];
  values: Record<string, string | number | boolean>;
  onChange: (fieldId: string, value: string | number | boolean) => void;
  onFormikChange?: (formik: FormikProps<FormValues>) => void;
}

type FormValues = Record<string, string | number | boolean>;

// Common props for field components
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

// AutoSave component
function AutoSave({
  onChange,
}: {
  onChange: (name: string, value: string | number | boolean) => void;
}) {
  const { values } = useFormikContext<FormValues>();
  const previousValuesRef = useRef<FormValues>({});

  useEffect(() => {
    // Only update if values have actually changed
    if (JSON.stringify(previousValuesRef.current) !== JSON.stringify(values)) {
      previousValuesRef.current = values;
      Object.entries(values).forEach(([key, value]) => {
        onChange(key, value);
      });
    }
  }, [values, onChange]);

  return null;
}

// Text input component
const TextInput: React.FC<FormikInputProps> = ({ field, fieldDef }) => (
  <Input
    id={fieldDef.id}
    value={(field.value as string) || ""}
    onChange={field.onChange}
    onBlur={field.onBlur}
    name={field.name}
  />
);

// Number input component
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
  />
);

// Select component
const SelectInput: React.FC<FormikInputProps> = ({ field, form, fieldDef }) => {
  const mounted = useRef(false);
  const defaultValue = fieldDef.default?.toString() ?? "";

  // İlk mount'ta ve sadece bir kez çalışacak effect
  useEffect(() => {
    if (!mounted.current && !field.value && defaultValue) {
      form.setFieldValue(field.name, defaultValue, false);
    }
    mounted.current = true;
  }, [defaultValue, field.name, field.value, form]);

  if (!fieldDef.options) return null;

  // Field'ın mevcut değerini kullan, yoksa varsayılan değeri kullan
  const value = field.value?.toString() || defaultValue;

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        form.setFieldValue(field.name, newValue);
        form.setFieldTouched(field.name, true, false);
      }}
      name={field.name}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={fieldDef.name} />
      </SelectTrigger>
      <SelectContent>
        {fieldDef.options?.map((option: { id: string; name: string }) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Radio component
const RadioInput: React.FC<FormikInputProps> = ({ field, form, fieldDef }) => {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (
      isFirstMount.current &&
      fieldDef.default !== undefined &&
      !field.value
    ) {
      const defaultValue = fieldDef.default.toString();
      form.setFieldValue(field.name, defaultValue, false);
      isFirstMount.current = false;
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
        form.submitForm();
      }}
      className="flex flex-col space-y-2"
      name={field.name}
    >
      {fieldDef.options?.map((option: { id: string; name: string }) => (
        <div key={option.id} className="flex items-center space-x-2">
          <RadioGroupItem
            value={option.id}
            id={`${fieldDef.id}-${option.id}`}
          />
          <Label htmlFor={`${fieldDef.id}-${option.id}`}>{option.name}</Label>
        </div>
      ))}
    </RadioGroup>
  );
};

// Checkbox component
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
    />
    <Label htmlFor={fieldDef.id}>{fieldDef.name}</Label>
  </div>
);

// Color component
const ColorInput: React.FC<FormikInputProps> = ({ field, form, fieldDef }) => {
  if (!fieldDef.options) return null;

  const getColorCode = (optionId: string): string => {
    const colorMap: Record<string, string> = {
      beyaz: "#ffffff",
      siyah: "#000000",
      gri: "#888888",
      kahve: "#5D4037",
      krem: "#FFF8DC",
      wenge: "#4E342E",
      meşe: "#D7CCC8",
      antrasit: "#37474F",
    };
    return colorMap[optionId] || optionId;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {fieldDef.options?.map((option: { id: string; name: string }) => (
        <button
          key={option.id}
          type="button"
          className={`w-8 h-8 rounded-full border-2 ${
            field.value === option.id ? "border-blue-600" : "border-gray-300"
          }`}
          style={{
            backgroundColor: getColorCode(option.id),
          }}
          onClick={() => form.setFieldValue(field.name, option.id)}
          title={option.name}
        />
      ))}
    </div>
  );
};

// Check all dependencies in the chain
const checkDependencyChain = (
  currentField: ProductTabField,
  values: FormValues,
  fields: ProductTabField[],
  visited = new Set<string>()
): boolean => {
  if (!currentField.dependsOn) return true;
  if (visited.has(currentField.id)) return true; // Break circular dependencies

  visited.add(currentField.id);
  const { field: parentField, value: requiredValue } = currentField.dependsOn;
  const currentValue = values[parentField]?.toString();
  const expectedValue = requiredValue?.toString();

  // If immediate dependency is not met
  if (currentValue !== expectedValue) {
    return false;
  }

  // Find parent field definition and check its dependencies
  const parentFieldDef = fields.find((f) => f.id === parentField);
  if (parentFieldDef) {
    return checkDependencyChain(parentFieldDef, values, fields, visited);
  }

  return true;
};

// Main FormikInputs component
const FormikInputs = (props: FormikInputProps) => {
  switch (props.fieldDef.type) {
    case "text":
      return <TextInput {...props} />;
    case "number":
      return <NumberInput {...props} />;
    case "select":
      return <SelectInput {...props} />;
    case "radio":
      return <RadioInput {...props} />;
    case "checkbox":
      return <CheckboxInput {...props} />;
    case "color":
      return <ColorInput {...props} />;
    default:
      return null;
  }
};

export function DynamicForm({ fields, values, onChange }: DynamicFormProps) {
  const formRef = useRef<FormikProps<FormValues>>(null);

  // Prepare initial values and validation schema
  const [initialValues, validationSchema] = useMemo(() => {
    const initValues: FormValues = { ...values }; // Mevcut değerleri doğrudan kopyala
    const schema: Record<
      string,
      Yup.StringSchema | Yup.NumberSchema | Yup.BooleanSchema | Yup.MixedSchema
    > = {};

    fields.forEach((field) => {
      // Eğer değer zaten varsa, onu koru
      if (!(field.id in initValues)) {
        if (field.default !== undefined) {
          initValues[field.id] =
            typeof field.default === "boolean"
              ? field.default
              : field.default.toString();
        } else {
          // Değer yoksa alan tipine göre varsayılan değer ata
          initValues[field.id] = field.type === "number" ? 0 : "";
        }
      }

      // Validation schema oluştur
      switch (field.type) {
        case "number": {
          let validation = Yup.number().typeError("Sayısal bir değer giriniz");
          if (field.min !== undefined) {
            validation = validation.min(
              field.min,
              `En az ${field.min} olmalıdır`
            );
          }
          if (field.max !== undefined) {
            validation = validation.max(
              field.max,
              `En fazla ${field.max} olabilir`
            );
          }
          schema[field.id] = validation;
          break;
        }
        case "select":
        case "radio":
          schema[field.id] = Yup.string().required("Bu alan zorunludur");
          break;
        case "text":
          schema[field.id] = Yup.string();
          break;
        case "checkbox":
          schema[field.id] = Yup.boolean();
          break;
        default:
          schema[field.id] = Yup.mixed();
      }
    });

    return [initValues, schema];
  }, [fields, values]);

  // Force form values to update when values prop changes
  useEffect(() => {
    if (formRef.current) {
      Object.entries(values).forEach(([key, value]) => {
        if (formRef.current?.values[key] !== value) {
          formRef.current?.setFieldValue(key, value);
        }
      });
    }
  }, [values]);

  // Determine if fields should be displayed in a grid
  const shouldUseGrid =
    fields.length >= 2 &&
    fields.every((field) => ["number", "text", "select"].includes(field.type));

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={Yup.object().shape(validationSchema)}
      onSubmit={() => {}}
      validateOnMount={false}
      validateOnChange={true}
      enableReinitialize={false}
    >
      {(formikProps) => (
        <Form className="space-y-6">
          <AutoSave onChange={onChange} />
          <div
            className={
              shouldUseGrid ? "grid grid-cols-2 gap-x-4 gap-y-6" : "space-y-6"
            }
          >
            {fields.map((field) => {
              // Check dependencies before rendering anything
              if (!checkDependencyChain(field, formikProps.values, fields)) {
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
                  />
                  {formikProps.errors[field.id] &&
                    formikProps.touched[field.id] && (
                      <div className="text-red-500 text-sm">
                        {formikProps.errors[field.id]?.toString()}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </Form>
      )}
    </Formik>
  );
}
