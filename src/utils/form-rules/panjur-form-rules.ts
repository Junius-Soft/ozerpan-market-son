import { Product, ProductTabField } from "@/documents/products";
import { PanjurSelections } from "@/types/panjur";
import { lamelProperties } from "@/constants/panjur";
import { FormikProps } from "formik";
import { toast } from "react-toastify";

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
  values: PanjurSelections,
  formik: FormikProps<PanjurSelections & Record<string, string | number | boolean>>,
  selectedProduct: Product | null
) {
  const width = values?.width ? parseFloat(String(values.width)) : 0;
  const height = values?.height ? parseFloat(String(values.height)) : 0;
  const squareMeters = (width * height) / 1000000; // Convert from mm² to m²
  const lamelType = values?.lamelType;
  const movementType = values.movementType;
  const motorModel = values.motorModel;

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

  // Eğer motorlu seçiliyse ve uygun motor seçeneği yoksa manuel'e çevir
  if (movementType === "motorlu" && !motorModelOptions?.length) {
    formik.setFieldValue("movementType", "manuel");
    formik.setFieldValue("manuelSekli", "makarali");
    formik.setFieldValue("makaraliTip", "makassiz");
    toast.warn(
      "Seçilen ölçüler için uygun motor bulunamadı. Hareket tipi manuel olarak ayarlandı."
    );
    return null;
  }

  // Only update motorModel if current value is not in valid options
  const currentMotorModel = motorModel;
  const isCurrentModelValid = motorModelOptions?.some(
    (option) => option.id === currentMotorModel
  );

  if (!isCurrentModelValid && motorModelOptions?.length) {
    formik.setFieldValue("motorModel", motorModelOptions[0]?.id || "");
  }

  return motorModelOptions;
}

// Updated `filterLamelThickness` to accept `FormikProps<PanjurSelections>`.
export function filterLamelThickness(
  formik: FormikProps<PanjurSelections & Record<string, string | number | boolean>>,
  values: PanjurSelections
): ProductTabField["options"] | null {
  const width = Number(values.width);
  const height = Number(values.height);
  const lamelType = values?.lamelType as string;

  if (!lamelType) {
    return null;
  }

  // Filter valid options based on dimensions
  const validOptions = Object.entries(lamelProperties)
    .filter(([key, props]) => {
      const isTypeValid =
        lamelType === "aluminyum_ekstruzyon"
          ? key.includes("_se")
          : key.includes("_sl");

      return (
        isTypeValid && width <= props.maxWidth && height <= props.maxHeight
      );
    })
    .map(([key]) => ({ id: key, label: key, name: key }));

  const thicknessOptions = validOptions.length > 0 ? validOptions : null;

  // Always select the first valid option
  if (thicknessOptions?.length) {
    formik.setFieldValue("lamelTickness", thicknessOptions[0].id || "");
  } else {
    const alternativeLamelType =
      lamelType === "aluminyum_ekstruzyon"
        ? "aluminyum_poliuretanli"
        : "aluminyum_ekstruzyon";
    formik.setFieldValue("lamelType", alternativeLamelType);

    // Show toast warning message
    toast.warn(
      "Uygun lamel kalınlığı bulunamadı, alternatif bir lamel tipi seçildi."
    );
    return null;
  }

  return thicknessOptions;
}
