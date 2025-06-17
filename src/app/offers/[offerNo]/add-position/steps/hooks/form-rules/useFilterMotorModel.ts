import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { Product } from "@/documents/products";
import { toast } from "react-toastify";

export type FormValues = Record<string, string | number | boolean>;

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
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  selectedProduct: Product | null
) {
  const values = formik.values;
  const width = values?.width ? parseFloat(String(values.width)) : 0;
  const height = values?.height ? parseFloat(String(values.height)) : 0;
  const squareMeters = (width * height) / 1000000; // Convert from mm² to m²
  const lamelType = values?.lamelType;
  const movementType = values.movementType;

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
      values?.motorMarka === "mosel"
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
  const motorModelOptions = selectedProduct?.tabs
    ?.find((tab) => tab.id === "movement")
    ?.content?.fields.find((field) => field.id === "motorModel")
    ?.options?.filter((option) =>
      validMotors.includes(option.id as MotorModel)
    );
  console.log({ motorModelOptions });

  // Eğer motorlu seçiliyse ve uygun motor seçeneği yoksa manuel'e çevir
  if (movementType === "motorlu" && !motorModelOptions?.length) {
    formik.setFieldValue("movementType", "manuel");
    toast.warn(
      "Seçilen ölçüler için uygun motor bulunamadı. Hareket tipi manuel olarak ayarlandı."
    );
    return null;
  }
  const motorModel = values.motorModel as MotorModel;
  // Only update motorModel if current value is not in valid options
  const currentMotorModel = motorModel;
  const isCurrentModelValid = motorModelOptions?.some(
    (option) => option.id === currentMotorModel
  );

  if (motorModelOptions?.length && !isCurrentModelValid) {
    formik.setFieldValue("motorModel", motorModelOptions[0]?.id || "");
  }
  return motorModelOptions;
}

// Main hook that manages all form rules
export function useFilterMotorModel(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  selectedProduct: Product | null
) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { width, height, lamelType, movementType, motorMarka, motorModel } =
    formik.values;

  useEffect(() => {
    if (productId === "panjur") {
      // Filter motor options
      filterMotorOptions(formik, selectedProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    lamelType,
    movementType,
    motorMarka,
    motorModel,
    productId,
    selectedProduct,
  ]);

  return {};
}
