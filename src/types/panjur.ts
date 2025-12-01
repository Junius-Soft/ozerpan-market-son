import { BaseSelections } from "./products";

// Define types for price items
export interface PriceItem {
  description: string;
  stock_code: string;
  uretici_kodu: string;
  type: string;
  color: string;
  unit: string;
  price: string;
  quantity?: number; // Optional quantity field for tracking how many of each item is needed
  lamel_type?: string; // Kepenk aksesuar özellikleri
  dikme_type?: string;
  tambur_type?: string;
  hareket_tip?: string;
  kutu_type?: string;
  [key: string]: string | number | undefined; // Dinamik property'ler için
}

// New interface for tracking selected items
export interface SelectedProduct extends PriceItem {
  quantity: number; // Required in selected products
  totalPrice: number; // Price * quantity
  size?: number; // Ürün ölçüsü (ör: 120x200), zorunlu
}

// Interface for calculation results
export interface CalculationResult {
  totalPrice: number;
  selectedProducts: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  }; // Artık iki obje içeriyor
  errors: string[];
}

export interface PanjurSelections extends BaseSelections {
  yalitimliType?: "fullset" | "boxset" | "detail";
  boxsetType?: "boxWithMotor" | "emptyBox";
  yalitimliDetailType?: "withoutBox" | "onlyMotor";
  middleBarPositions?: number[];
  sectionHeights?: number[];
  sectionMotors?: boolean[];
  sectionConnections?: string[];
  sectionMotorPositions?: string[];
  panjurType: "distan" | "monoblok" | "yalitimli";
  width: number;
  height: number;
  kutuOlcuAlmaSekli: "kutu_dahil" | "kutu_haric";
  dikmeOlcuAlmaSekli: "dikme_dahil" | "dikme_haric" | "tek_dikme";
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
  manuelSekli?: "makarali" | "reduktorlu";
  makaraliTip?: "makassiz" | "makasli";
  motorMarka?: "mosel" | "somfy";
  motorSekli?:
    | "duz_motorlu"
    | "alicili_motorlu"
    | "alicili_motorlu_reduktorlu"
    | "alicili_motorlu_geri_bildirimli"
    | "alicili_motorlu_geri_bildirimli_engel-tanimali"
    | "solar_panelli";
  motorModel?: string;
  buton?: "yok" | "alicili-buton" | "siva-alti-kalici" | "siva-ustu-kasa";
  receiver?: string;
  remote?: string;
  smarthome?: "yok" | "mosel_dd_7002_b" | "somfy_tahoma_switch_pro";
  lamelType: "aluminyum_poliuretanli" | "aluminyum_ekstruzyon";
  lamelTickness: "39_sl" | "45_se" | "55_sl" | "55_se";
  aski_kilit_secimi: "yok" | "aski_kilit";
  packagingType: "yok" | "var";
  boxType:
    | "137mm"
    | "165mm"
    | "205mm"
    | "250mm"
    | "185mm"
    | "185x220mm"
    | "220mm"
    | "220x255mm"
    | "250mm_yerli"
    | "250mm_ithal"
    | "300mm_yerli"
    | "300mm_ithal";
  dikmeType:
    | "mini_dikme"
    | "mini_orta_dikme"
    | "midi_dikme"
    | "midi_orta_dikme"
    | "mini_pvc_dikme"
    | "mini_pvc_orta_dikme"
    | "midi_pvc_dikme"
    | "midi_pvc_orta_dikme";
  dikmeAdapter: "yok" | "double_sided" | "triple_sided";
  subPart: "mini_alt_parca" | "kilitli_alt_parca" | "midi_alt_parca";
  lamel_color: string;
  box_color: string;
  subPart_color: string;
  dikme_color: string;
  unitPrice: number; // Added `unitPrice` property
  selectedProducts: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  };
}

export interface LamelProperties {
  maxWidth: number;
  maxHeight: number;
  maxArea: number;
}

export interface MaxLamelHeight {
  manuel: number | null;
  motorlu: number | null;
}

export interface LamelHeightTable {
  [optionType: string]: {
    // "distan" | "monoblok"
    [boxSize: string]: {
      [lamelType: string]: MaxLamelHeight;
    };
  };
}
