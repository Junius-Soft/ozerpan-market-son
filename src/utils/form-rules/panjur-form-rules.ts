import { FormValues } from "@/app/offers/[offerNo]/add-position/steps/hooks/useFormRules";
import { ProductTab, ProductTabField } from "@/documents/products";
import { PanjurSelections } from "@/types/panjur";
import { FormikProps } from "formik";
import { RefObject } from "react";

// Constants for motor capacities based on lamel thickness
const MOTOR_CAPACITY_MAP = {
  "39_sl": {
    "sel_60-10": 8.6,
    "sel_60-20": 13.2,
    "sel_60-30": 19.6,
    "sel_60-50": 26.4,
    boost_15: 6.5,
    boost_35: 15.2,
    boost_55: 23.9,
  },
  "55_sl": {
    "sel_60-10": 7.6,
    "sel_60-20": 11.7,
    "sel_60-30": 17.3,
    "sel_60-50": 23.4,
    boost_15: 5.7,
    boost_35: 13.4,
    boost_55: 21.1,
  },
  "45_se": {
    "sel_60-10": 0,
    "sel_60-20": 4.1,
    "sel_60-30": 6.1,
    "sel_60-50": 8.3,
    boost_15: 2,
    boost_35: 4.7,
    boost_55: 7.5,
  },
  "55_se": {
    "sel_60-10": 0,
    "sel_60-20": 5,
    "sel_60-30": 7.5,
    "sel_60-50": 10.1,
    boost_15: 2.5,
    boost_35: 5.8,
    boost_55: 9.1,
  },
} as const;

type LamelThickness = keyof typeof MOTOR_CAPACITY_MAP;
type MotorModel = keyof (typeof MOTOR_CAPACITY_MAP)[LamelThickness];

export function filterMotorOptions(
  selections: PanjurSelections,
  formRef: RefObject<FormikProps<FormValues> | null>,
  formDataResponse?: ProductTab[],
  onNoMotorOptions?: () => void
) {
  // Eğer form data yoksa işlem yapamayız
  if (!formDataResponse) {
    return null;
  }

  const width = selections?.width ? parseFloat(String(selections.width)) : 0;
  const height = selections?.height ? parseFloat(String(selections.height)) : 0;
  const squareMeters = (width * height) / 1000000; // Convert from mm² to m²
  const lamelType = selections?.lamelType;
  const movementType = formRef.current?.values.movementType;
  const motorModel = formRef.current?.values.motorModel;

  // Eğer motorlu değilse veya gerekli veriler eksikse işlem yapamayız
  if (movementType !== "motorlu" || !width || !height || !lamelType) {
    return null;
  }

  // Filter lamel thicknesses based on lamel type
  const validThicknesses = Object.keys(MOTOR_CAPACITY_MAP).filter((thickness) =>
    lamelType === "aluminyum_ekstruzyon"
      ? thickness.includes("_se")
      : thickness.includes("_sl")
  ) as LamelThickness[];

  // Get all possible motor models from all valid thicknesses
  const motorModels = [
    ...new Set(
      validThicknesses.flatMap((thickness) =>
        Object.keys(MOTOR_CAPACITY_MAP[thickness])
      )
    ),
  ] as MotorModel[];

  // Filter motor models based on square meters and motorMarka
  const validMotors = motorModels.filter((motor) => {
    // First check if the motor matches the selected brand
    const isValidMotorMarka =
      selections?.motorMarka === "mosel"
        ? motor.startsWith("sel_")
        : motor.startsWith("boost_");

    if (!isValidMotorMarka) return false;

    // Then check if any of the valid thicknesses can support this motor with given square meters
    return validThicknesses.some((thickness) => {
      const capacity = MOTOR_CAPACITY_MAP[thickness][motor];
      return capacity >= squareMeters && capacity > 0; // Ensure capacity is greater than 0
    });
  });

  // get motorModel form select input options
  const motorModelOptions = formDataResponse
    .find((tab) => tab.id === "movement")
    ?.content?.fields.find((field) => field.id === "motorModel")
    ?.options?.filter((option) =>
      validMotors.includes(option.id as MotorModel)
    );

  // Eğer motorlu seçiliyse ve uygun motor seçeneği yoksa manuel'e çevir
  if (movementType === "motorlu" && !motorModelOptions?.length) {
    formRef?.current?.setFieldValue("movementType", "manuel");
    onNoMotorOptions?.();
    return null;
  }

  // Only update motorModel if current value is not in valid options
  const currentMotorModel = motorModel;
  const isCurrentModelValid = motorModelOptions?.some(
    (option) => option.id === currentMotorModel
  );

  if (!isCurrentModelValid && motorModelOptions?.length) {
    formRef?.current?.setFieldValue(
      "motorModel",
      motorModelOptions[0]?.id || ""
    );
  }

  return motorModelOptions;
}

export const handleColorSync = (
  fields: ProductTabField[],
  formRef: RefObject<FormikProps<FormValues> | null>,
  values?: FormValues
) => {
  const currentLamelColor = values?.lamel_color;
  if (!currentLamelColor) return;

  // Find all color fields except lamel_color
  const colorFields = fields.filter(
    (field) =>
      field.id !== "lamel_color" &&
      field.id.toLowerCase().includes("_color") &&
      values[field.id as keyof PanjurSelections] !== currentLamelColor
  );

  // Update each color field that has a matching option
  colorFields.forEach((field) => {
    const newValue = field.options?.find(
      (fieldItem) => fieldItem.id === currentLamelColor
    )
      ? currentLamelColor
      : "ral_boyali";

    if (values[field.id as keyof PanjurSelections] !== newValue) {
      formRef?.current?.setFieldValue(
        field.id as keyof PanjurSelections,
        newValue
      );
    }
  });
};
