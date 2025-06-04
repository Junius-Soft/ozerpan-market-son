import { FormikProps } from "formik";

type FormValues = Record<string, string | number | boolean>;

export const useSelectHandlers = (form: FormikProps<FormValues>) => {
  const handleSelectChange = (fieldId: string, value: string) => {
    form.setFieldValue(fieldId, value, false);
    // switch (fieldId) {
    //   case "motorModel":
    //     motorModelHandler(form, value);
    //     break;

    //   // Diğer özel işlemler buraya eklenebilir
    //   case "lamel_color":
    //     // _colorla bitenleri lamel_color ile senkronize et eğer lamel_color rengi option olarak yoksa ral_boyali seç
    //     const lamelColor = value;
    //     const colorFields = Object.keys(form.values).filter(
    //       (key) => key.toLowerCase().includes("_color") && key !== "lamel_color"
    //     );
    //     colorFields.forEach((colorField) => {
    //       const currentColorValue = form.values[colorField];
    //       const matchingOption = form.values.lamel_color
    //         ? form.values.lamel_color
    //             .split("_")
    //             .find((option) => option === currentColorValue)
    //         : null;
    //       if (!matchingOption) {
    //         form.setFieldValue(colorField, "ral_boyali", false);
    //       } else {
    //         form.setFieldValue(colorField, lamelColor, false);
    //       }
    //     });
    //     break;

    //   // Varsayılan durum
    //   default:
    //     form.setFieldValue(fieldId, value, false);
    // }
  };

  return {
    handleSelectChange,
  };
};
