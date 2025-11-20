import { LamelProperties } from "@/types/kepenk";

// Lamel özellikleri sabitleri (Excel'den alınan veriler)
export const lamelProperties: Record<string, LamelProperties> = {
  st_77: {
    maxWidth: 5000,
    maxHeight: 4000,
    maxArea: 20.0, // m2
  },
  sl_77: {
    maxWidth: 5400,
    maxHeight: 3850,
    maxArea: 18.0, // m2
  },
  se_77: {
    maxWidth: 7000,
    maxHeight: 5000,
    maxArea: 25.0, // m2
  },
  se_78: {
    maxWidth: 5000,
    maxHeight: 5000,
    maxArea: 20.0, // m2
  },
  st_100: {
    maxWidth: 8000,
    maxHeight: 6000,
    maxArea: 40.0, // m2
  },
  sl_100: {
    maxWidth: 7000,
    maxHeight: 5000,
    maxArea: 30.0, // m2
  },
};

// Kepenk tipi (Maxi/Mega) - Lamel tipine göre otomatik seçim
export const kepenkTipleri = {
  maxi: {
    lamelTypes: ["st_77", "sl_77", "se_77", "se_78"],
    dikmeType: "77_lik",
    tamburType: "70mm",
    boxType: "300mm",
  },
  mega: {
    lamelTypes: ["st_100", "sl_100"],
    dikmeType: "100_luk",
    tamburType: "102mm",
    boxType: "350mm",
  },
};

