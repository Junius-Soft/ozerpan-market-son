"use client";

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

interface DynamicFormProps {
  fields: ProductTabField[];
  values: Record<string, string | number | boolean>;
  onChange: (fieldId: string, value: string | number | boolean) => void;
}

export function DynamicForm({ fields, values, onChange }: DynamicFormProps) {
  const handleNumberChange = (fieldId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange(fieldId, numValue);
    }
  };

  const handleNumberBlur = (field: ProductTabField, value: number) => {
    if (field.min !== undefined && value < field.min) {
      onChange(field.id, field.min);
    } else if (field.max !== undefined && value > field.max) {
      onChange(field.id, field.max);
    }
  };

  // Helper functions to safely get values with correct types
  const getStringValue = (id: string, defaultVal: string = ""): string => {
    const value = values[id];
    return typeof value === "string" ? value : defaultVal;
  };

  const getNumberValue = (id: string, defaultVal: number = 0): number => {
    const value = values[id];
    return typeof value === "number" ? value : defaultVal;
  };

  const getBooleanValue = (
    id: string,
    defaultVal: boolean = false
  ): boolean => {
    const value = values[id];
    return typeof value === "boolean" ? value : defaultVal;
  };

  // Determine if fields should be displayed in a grid (2 columns) based on field type
  // Perfect for 2 number inputs side-by-side in the dimensions tab
  const shouldUseGrid =
    fields.length >= 2 &&
    fields.every(
      (field) =>
        field.type === "number" ||
        field.type === "text" ||
        field.type === "select"
    );

  // Function to render the appropriate input for a field type
  const renderFieldInput = (field: ProductTabField) => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            value={getStringValue(field.id, (field.default as string) || "")}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            value={getNumberValue(field.id, (field.default as number) || 0)}
            onChange={(e) => handleNumberChange(field.id, e.target.value)}
            onBlur={(e) => handleNumberBlur(field, parseFloat(e.target.value))}
            min={field.min}
            max={field.max}
          />
        );

      case "select":
        if (!field.options) return null;
        return (
          <Select
            value={getStringValue(field.id, (field.default as string) || "")}
            onValueChange={(value) => onChange(field.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        if (!field.options) return null;
        return (
          <RadioGroup
            value={getStringValue(field.id, (field.default as string) || "")}
            onValueChange={(value) => onChange(field.id, value)}
            className="flex flex-col space-y-2"
          >
            {field.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.id}
                  id={`${field.id}-${option.id}`}
                />
                <Label htmlFor={`${field.id}-${option.id}`}>
                  {option.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={getBooleanValue(
                field.id,
                (field.default as boolean) || false
              )}
              onCheckedChange={(checked) => onChange(field.id, !!checked)}
            />
            <Label htmlFor={field.id}>{field.name}</Label>
          </div>
        );

      case "color":
        if (!field.options) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <button
                key={option.id}
                className={`w-8 h-8 rounded-full border-2 ${
                  getStringValue(field.id) === option.id
                    ? "border-blue-600"
                    : "border-gray-300"
                }`}
                style={{
                  backgroundColor:
                    option.id === "beyaz"
                      ? "#ffffff"
                      : option.id === "siyah"
                      ? "#000000"
                      : option.id === "gri"
                      ? "#888888"
                      : option.id === "kahve"
                      ? "#5D4037"
                      : option.id === "krem"
                      ? "#FFF8DC"
                      : option.id === "wenge"
                      ? "#4E342E"
                      : option.id === "meşe"
                      ? "#D7CCC8"
                      : option.id === "antrasit"
                      ? "#37474F"
                      : option.id,
                }}
                onClick={() => onChange(field.id, option.id)}
                title={option.name}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {shouldUseGrid ? (
        // Render in 2-column grid layout
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.type !== "checkbox" && (
                <Label htmlFor={field.id}>{field.name}</Label>
              )}
              {renderFieldInput(field)}
            </div>
          ))}
        </div>
      ) : (
        // Default vertical layout
        fields.map((field) => (
          <div key={field.id} className="space-y-2">
            {field.type !== "checkbox" && (
              <Label htmlFor={field.id}>{field.name}</Label>
            )}
            {renderFieldInput(field)}
          </div>
        ))
      )}
    </div>
  );
}
