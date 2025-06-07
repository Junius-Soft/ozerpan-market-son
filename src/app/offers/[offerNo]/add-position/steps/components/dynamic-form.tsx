"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { ProductTab, ProductTabField } from "@/documents/products";
import { type ChangeEvent, type FocusEvent } from "react";
import { PanjurSelections } from "@/types/panjur";

interface DynamicFormProps {
  fields: ProductTabField[];
  formDataResponse: ProductTab[];
  values: Record<string, string | number | boolean>;
  selections: PanjurSelections;
  onChange: (fieldId: string, value: string | number | boolean) => void;
  onFormikChange?: (formik: FormikProps<FormValues>) => void;
  formRef?: React.MutableRefObject<HTMLFormElement | null>;
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

function AutoSave({
  onChange,
}: {
  onChange: (name: string, value: string | number | boolean) => void;
}) {
  const { values } = useFormikContext<FormValues>();
  const previousValuesRef = useRef<FormValues>({});

  useEffect(() => {
    if (JSON.stringify(previousValuesRef.current) !== JSON.stringify(values)) {
      previousValuesRef.current = values;
      Object.entries(values).forEach(([key, value]) => {
        onChange(key, value);
      });
    }
  }, [values, onChange]);

  return null;
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

const SelectInput: React.FC<FormikInputProps & { allFields?: ProductTabField[] }> = ({ field, form, fieldDef, allFields }) => {
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
        console.log(filter);

        // CustomFilter kontrolü
        if (filter.field === "customFilter" && filter.properties) {
          if (fieldDef.id === "lamelTickness") {
            const width = Number(values["width"]) || 0;
            const height = Number(values["height"]) || 0;

            return filteredOpts.filter((option) => {
              const optionId = option.id || option.name;
              const properties = filter.properties?.[optionId];

              if (properties) {
                const withinMaxWidth =
                  !properties.maxWidth || width <= properties.maxWidth;
                const withinMaxHeight =
                  !properties.maxHeight || height <= properties.maxHeight;
                return withinMaxWidth && withinMaxHeight;
              }
              return true;
            });
          }
        }
        console.log({ filteredOpts });
        return filteredOpts;
      }, options);
    }

    return options;
  }, [fieldDef.options, fieldDef.filterBy, fieldDef.id, values]);

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
            {option.name}
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

// Utils'e taşındı
import { checkDependencyChain } from "@/utils/dependencies";
import { useFormRules } from "../hooks/useFormRules";

const FormikInputs = (props: FormikInputProps & { allFields?: ProductTabField[] }) => {
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

export function DynamicForm({
  fields,
  formDataResponse,
  values,
  selections,
  onChange,
  formRef,
}: DynamicFormProps) {
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const stateRef = useRef({
    previousValues: values,
    updateQueue: [] as Array<() => void>,
    processing: false,
  });

  const [initialValues, validationSchema] = useMemo(() => {
    const initValues: FormValues = { ...selections };
    const schema: Record<
      string,
      Yup.StringSchema | Yup.NumberSchema | Yup.BooleanSchema | Yup.MixedSchema
    > = {};

    fields.forEach((field) => {
      if (!(field.id in initValues) || initValues[field.id] === undefined) {
        initValues[field.id] =
          field.default !== undefined
            ? typeof field.default === "boolean"
              ? field.default
              : field.default.toString()
            : field.type === "number"
            ? 0
            : "";
      }

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
  }, [fields, selections]);

  useEffect(() => {
    const state = stateRef.current;
    if (
      formikRef.current &&
      JSON.stringify(state.previousValues) !== JSON.stringify(values)
    ) {
      const formik = formikRef.current;
      const updatedFields = Object.entries(values).filter(
        ([key, value]) => value !== undefined && formik.values[key] !== value
      );

      if (updatedFields.length > 0) {
        updatedFields.forEach(([key, value]) => {
          formik.setFieldValue(key, value, false);
        });
        state.previousValues = values;
      }
    }
  }, [values]);

  const processQueue = useCallback(() => {
    const state = stateRef.current;
    if (!state.processing && state.updateQueue.length > 0) {
      state.processing = true;
      const updates = state.updateQueue;
      state.updateQueue = [];

      updates.forEach((update) => update());
      state.processing = false;

      if (state.updateQueue.length > 0) {
        setTimeout(processQueue, 0);
      }
    }
  }, []);

  const handleFormChange = useCallback(
    (name: string, value: string | number | boolean) => {
      if (!formikRef.current) return;

      const state = stateRef.current;
      state.updateQueue.push(() => {
        onChange(name, value);
      });

      // Check if the changed field has a product_group_selector
      if (!state.processing) {
        processQueue();
      }
    },
    [onChange, processQueue]
  );

  // Add custom hooks
  useFormRules(formikRef, fields, formDataResponse, selections);
  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={Yup.object().shape(validationSchema)}
      onSubmit={(values) => {
        // Form is valid, we can process the submission
        Object.entries(values).forEach(([key, value]) => {
          onChange(key, value);
        });
      }}
      validateOnMount={false}
      validateOnChange={true}
      enableReinitialize={false}
    >
      {(formikProps) => (
        <Form ref={formRef} className="space-y-6">
          <div className="space-y-6">
            {fields.map((field) => {
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
                    allFields={fields}
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
          <AutoSave onChange={handleFormChange} />
        </Form>
      )}
    </Formik>
  );
}
