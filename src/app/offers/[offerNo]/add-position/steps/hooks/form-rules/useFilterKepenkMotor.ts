import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { KepenkSelections } from "@/types/kepenk";
import { Product } from "@/documents/products";
import { selectKepenkMotor } from "@/utils/kepenk-motor-selection";

// Motor model ID'lerini form seçenekleriyle eşleştir
// selectKepenkMotor fonksiyonu "sel_70", "sel_70_120" gibi ID'ler döndürür
// Form'da ise "sel_70_80", "sel_70_100" gibi ID'ler var
// Bu eşleştirme, selectKepenkMotor'un döndürdüğü motor ID'sini form seçeneğine çevirir
const MOTOR_ID_TO_FORM_OPTION: Record<string, string> = {
  sel_70: "sel_70_80", // 70-80 Nm için sel_70_80 (en küçük 70mm motor)
  sel_70_120: "sel_70_120", // 70-120 Nm için sel_70_120 (70-100, 70-120, 70-140 için kullanılır)
  sel_102_120: "sel_102_230", // 102-230 Nm için sel_102_230
  sel_102_330: "sel_102_330", // 102-330 Nm için sel_102_330
  sel_900: "sel_800", // SEL-600/800 için sel_800
  sel_1000: "sel_1000", // SEL-1000 için sel_1000
};

export function useFilterKepenkMotor(
  formik: FormikProps<KepenkSelections & Record<string, string | number | boolean>>,
  selectedProduct: Product | null
) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { width, height, lamelType, movementType, motorModel } = formik.values;

  useEffect(() => {
    // Sadece kepenk ürünü için çalış
    if (productId !== "kepenk") {
      return;
    }

    // Motorlu değilse veya gerekli veriler eksikse işlem yapma
    if (movementType !== "motorlu" || !width || !height || !lamelType) {
      return;
    }

    // Eğer motorModel "auto" ise veya boşsa, otomatik seçim yap
    if (!motorModel || motorModel === "auto") {
      // Sistem alanını m² cinsinden hesapla
      const systemAreaM2 = ((width as number) * (height as number)) / 1000000;

      // Lamel tipine göre tambur tipini belirle
      const is100mm = (lamelType as string).includes("100");
      const tamburType = is100mm ? "102mm" : "70mm";

      // Otomatik motor seçimi
      const selectedMotorId = selectKepenkMotor(
        lamelType as string,
        systemAreaM2,
        tamburType
      );

      // Eğer 70mm tambur için motor bulunamazsa, 102mm tambur motorlarını da dene
      if (!selectedMotorId && !is100mm) {
        const alternativeMotorId = selectKepenkMotor(
          lamelType as string,
          systemAreaM2,
          "102mm"
        );
        if (alternativeMotorId) {
          // Motor ID'sini form seçeneğine çevir
          const formOption = MOTOR_ID_TO_FORM_OPTION[alternativeMotorId] || alternativeMotorId;
          formik.setFieldValue("motorModel", formOption);
          return;
        }
      }

      // Motor ID'sini form seçeneğine çevir
      if (selectedMotorId) {
        const formOption = MOTOR_ID_TO_FORM_OPTION[selectedMotorId] || selectedMotorId;
        formik.setFieldValue("motorModel", formOption);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, lamelType, movementType, motorModel, productId, selectedProduct]);

  return {};
}

