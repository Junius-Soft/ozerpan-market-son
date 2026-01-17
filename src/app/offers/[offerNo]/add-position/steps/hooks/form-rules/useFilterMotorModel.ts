import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { Product } from "@/documents/products";
import { toast } from "react-toastify";
import { calculateSystemWidth, getBoxHeight } from "@/utils/panjur";

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
  const lamelType = values?.lamelType;
  const movementType = values.movementType;
  
  // Sistem genişliği ve yüksekliğini doğru hesapla (dikme ve kutu paylarını dikkate alarak)
  const systemWidth = calculateSystemWidth(
    width,
    values.dikmeOlcuAlmaSekli || "dikme_dahil",
    values.dikmeType || "mini_dikme"
  );
  
  // Motor seçimi için sistem yüksekliği: kutu dahil seçildiğinde kutu yüksekliği düşülmeli
  // Çünkü motor kapasitesi lamel alanına göre hesaplanır, kutu alanı dahil değildir
  const kutuOlcuAlmaSekli = values.kutuOlcuAlmaSekli || "kutu_dahil";
  const boxType = values.boxType || "137mm";
  let systemHeightForMotor: number;
  
  if (kutuOlcuAlmaSekli === "kutu_dahil") {
    // Kutu dahil seçildiğinde: height - kutu yüksekliği (motor kapasitesi için)
    const kutuYuksekligi = getBoxHeight(boxType);
    systemHeightForMotor = height - kutuYuksekligi;
  } else {
    // Kutu hariç seçildiğinde: height (zaten kutu yüksekliği eklenmemiş)
    systemHeightForMotor = height;
  }
  
  // Sistem alanını m² cinsinden hesapla (motor seçimi için)
  const squareMeters = (systemWidth * systemHeightForMotor) / 1000000;

  // Eğer motorlu değilse veya gerekli veriler eksikse işlem yapamayız
  if (movementType !== "motorlu" || !width || !height || !lamelType) {
    return null;
  }

  // Seçili lamel kalınlığını al (39_sl, 45_se, 55_sl, 55_se)
  const lamelTickness = values?.lamelTickness as LamelThickness | undefined;
  
  // Eğer lamelTickness seçiliyse, sadece o kalınlığı kullan
  // Değilse, lamelType'a göre tüm uygun kalınlıkları kullan
  const validThicknesses: LamelThickness[] = lamelTickness && MOTOR_CAPACITY_MAP[lamelTickness]
    ? [lamelTickness]
    : (Object.keys(MOTOR_CAPACITY_MAP).filter((thickness) =>
        lamelType === "aluminyum_ekstruzyon"
          ? thickness.includes("_se")
          : thickness.includes("_sl")
      ) as LamelThickness[]);

  // Get all possible motor models from all valid thicknesses
  const motorModels = [
    ...new Set(
      validThicknesses.flatMap((thickness) =>
        Object.keys(MOTOR_CAPACITY_MAP[thickness])
      )
    ),
  ] as MotorModel[];

  // Önce sistem alanına göre en küçük uygun motoru bul
  // Sonra o motordan daha büyük kapasiteli tüm motorları da geçerli yap
  let minRequiredMotor: MotorModel | null = null;
  let minRequiredCapacity = Infinity;

  // Tüm motorları kontrol et ve en küçük uygun motoru bul
  for (const motor of motorModels) {
    // Motor markası kontrolü
    const isValidMotorMarka =
      values?.motorMarka === "mosel"
        ? motor.startsWith("sel_")
        : motor.startsWith("boost_");

    if (!isValidMotorMarka) continue;

    // Motor kapasitesini kontrol et
    const motorCapacity = validThicknesses.reduce((maxCapacity, thickness) => {
      const capacity = MOTOR_CAPACITY_MAP[thickness][motor];
      return capacity > maxCapacity ? capacity : maxCapacity;
    }, 0);

    // Eğer motor sistem alanını karşılayabiliyorsa ve şu ana kadar bulunan en küçük motordan daha küçükse
    if (motorCapacity >= squareMeters && motorCapacity > 0 && motorCapacity < minRequiredCapacity) {
      minRequiredCapacity = motorCapacity;
      minRequiredMotor = motor;
    }
  }

  // Şimdi en küçük uygun motordan daha büyük veya eşit kapasiteli tüm motorları geçerli yap
  const validMotors = motorModels.filter((motor) => {
    // Motor markası kontrolü
    const isValidMotorMarka =
      values?.motorMarka === "mosel"
        ? motor.startsWith("sel_")
        : motor.startsWith("boost_");

    if (!isValidMotorMarka) return false;

    // Motor kapasitesini al
    const motorCapacity = validThicknesses.reduce((maxCapacity, thickness) => {
      const capacity = MOTOR_CAPACITY_MAP[thickness][motor];
      return capacity > maxCapacity ? capacity : maxCapacity;
    }, 0);

    // Eğer en küçük uygun motor bulunduysa, sadece o motordan daha büyük veya eşit kapasiteli motorları geçerli yap
    if (minRequiredMotor) {
      return motorCapacity >= minRequiredCapacity && motorCapacity > 0;
    }

    // Eğer hiç uygun motor bulunamadıysa, eski mantığı kullan (geriye dönük uyumluluk)
    return validThicknesses.some((thickness) => {
      const capacity = MOTOR_CAPACITY_MAP[thickness][motor];
      return capacity >= squareMeters && capacity > 0;
    });
  });

  // get motorModel form select input options
  const motorModelOptions = selectedProduct?.tabs
    ?.find((tab) => tab.id === "movement")
    ?.content?.fields.find((field) => field.id === "motorModel")
    ?.options?.filter((option) =>
      validMotors.includes(option.id as MotorModel)
    );

  // Eğer motorlu seçiliyse ve uygun motor seçeneği yoksa uyarı ver
  if (movementType === "motorlu" && !motorModelOptions?.length) {
    toast.warn(
      "Seçilen ölçüler için uygun motor bulunamadı. Lütfen ölçüleri kontrol edin."
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
  const { width, height, lamelType, lamelTickness, movementType, motorMarka, motorModel, dikmeOlcuAlmaSekli, dikmeType, kutuOlcuAlmaSekli, boxType } =
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
    lamelTickness,
    movementType,
    motorMarka,
    motorModel,
    dikmeOlcuAlmaSekli,
    dikmeType,
    kutuOlcuAlmaSekli,
    boxType,
    productId,
    selectedProduct,
  ]);

  return {};
}
