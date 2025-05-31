// Define types for price items
export interface PriceItem {
  description: string;
  stock_code: string;
  uretici_kodu: string;
  type: string;
  color: string;
  unit: string;
  price: string;
}

// Interface for calculation results
export interface CalculationResult {
  systemWidth: number;
  systemHeight: number;
  lamelCount: number;
  lamelGenisligi: number;
  lamelPrice: number;
  postHeight: number;
  postCount: number;
  boxHeight: number;
  subPartWidth: number;
  totalPriceTL: number;
  errors: string[];
}

export interface PanjurSelections {
  productId: string;
  panjurType: "distan" | "monoblok" | "yalitimli";
  sectionCount: number;
  width: number;
  height: number;
  quantity: number;
  kutuOlcuAlmaSekli: "kutu_dahil" | "kutu_haric";
  dikmeOlcuAlmaSekli: "dikme_dahil" | "dikme_haric" | "tek_dikme";
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
  manuelSekli?: "makarali" | "reduktorlu";
  makaraliTip?: "makassiz" | "makasli";
  motorMarka?: "mosel" | "somfy";
  motorSekli?:
    | "duz-motorlu"
    | "alicili-motorlu"
    | "alicili-motorlu-reduktorlu"
    | "alicili-geri-bildirimli"
    | "alicili-geri-bildirimli-engel-tanimali"
    | "solar-panelli";
  motorModel?: string;
  buton?: "yok" | "alicili-buton" | "siva-alti-kalici" | "siva-ustu-kasa";
  receiver?: string;
  remote?: string;
  smarthome?: "yok" | "mosel_dd_7002_b" | "somfy_tahoma";
  lamelType: "aluminyum_poliuretanli" | "aluminyum_ekstruzyon";
  lamelTickness: "39_sl" | "55_sl" | "55_se";
  aski_kilit_secimi: "yok" | "aski_kilit";
  boxType: "137mm" | "165mm" | "205mm" | "250mm";
  dikmeType:
    | "mini_dikme"
    | "mini_orta_dikme"
    | "midi_dikme"
    | "midi_orta_dikme"
    | "mini_pvc_dikme"
    | "mini_pvc_orta_dikme"
    | "midi_pvc_dikme"
    | "midi_pvc_orta_dikme";
  dikmeAdapter: "yok" | "mini_dikme_adaptoru" | "fulset_dikme_adaptoru";
  subPart: "mini_alt_parca" | "kilitli_alt_parca";
  lamel_color: string;
  box_color: string;
  subPart_color: string;
  dikme_color: string;
}

export interface LamelProperties {
  tavsiyeEdilenMaksimumEn: number;
  tavsiyeEdilenMaksimumYukseklik: number;
  maksimumKullanimAlani: number;
}

export interface MaxLamelHeight {
  manuel: number | null;
  motorlu: number | null;
}

export interface LamelHeightTable {
  [boxSize: string]: {
    [lamelType: string]: MaxLamelHeight;
  };
}
