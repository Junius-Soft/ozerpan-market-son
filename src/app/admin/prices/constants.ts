export interface PriceItem {
  id: string;
  product_category: string;
  item_type: string;
  description: string;
  stock_code: string | null;
  uretici_kodu: string | null;
  type: string | null;
  color: string | null;
  unit: string | null;
  price: number;
  previous_price: number | null;
  currency: string;
  price_updated_at: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  panjur: "Panjur",
  sineklik: "Sineklik",
  kepenk: "Kepenk",
  cam_balkon: "Cam Balkon",
};

export const TYPE_LABELS: Record<string, string> = {
  panjur_lamel_profilleri: "Lamel Profilleri",
  panjur_kutu_profilleri: "Kutu Profilleri",
  monoblok_panjur_kutu_profilleri: "Monoblok Kutu",
  panjur_kutu_aksesuarları: "Kutu Aksesuarları",
  panjur_tambur_boru_profilleri: "Tambur Boru",
  panjur_tambur_boru_aksesuarları: "Tambur Boru Aks.",
  panjur_alt_parça_aksesuarları: "Alt Parça Aks.",
  panjur_lamel_aksesuarları: "Lamel Aks.",
  panjur_dikme_aksesuarları: "Dikme Aks.",
  panjur_motorlari: "Motorlar",
  panjur_montaj_aksesuarları: "Montaj Aks.",
  ortak_fitiller: "Fitiller",
  kepenk_lamel_profilleri: "Kepenk Lamel",
  kepenk_kutu_profilleri: "Kepenk Kutu",
  kepenk_aksesuarları: "Kepenk Aks.",
  kepenk_motorları: "Kepenk Motor",
  sineklik_profilleri: "Sineklik Profil",
  sineklik_aksesuarları: "Sineklik Aks.",
  cam_balkon_profilleri: "Cam Balkon Profil",
  cam_balkon_aksesuarları: "Cam Balkon Aks.",
  cam_balkon_camlari: "Cam Balkon Cam",
};
