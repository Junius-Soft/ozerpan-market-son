import { useSelector, useDispatch } from "react-redux";
import {
  setMiddleBarPositions,
  setSectionHeights,
  setSectionMotors,
  setSectionConnections,
  setSectionMotorPositions,
} from "@/store/shutterSlice";
import { PanjurSelections } from "@/types/panjur";
import { KepenkSelections } from "@/types/kepenk";

interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
  sectionMotors: boolean[];
  sectionConnections: string[];
  sectionMotorPositions: string[];
}

export interface ProductSpecificState {
  // Panjur için
  middleBarPositions?: number[];
  sectionHeights?: number[];
  sectionMotors?: boolean[];
  sectionConnections?: string[];
  sectionMotorPositions?: string[];

  // Gelecekteki ürünler için state'ler buraya eklenecek
  // Örneğin:
  // sineklikSpecificProp?: string[];
  // pergoleSpecificProp?: number[];
}

export interface ProductStateActions {
  setMiddleBarPositions?: (positions: number[]) => void;
  setSectionHeights?: (heights: number[]) => void;
  setSectionMotors?: (motors: boolean[]) => void;
  setSectionConnections?: (connections: string[]) => void;
  setSectionMotorPositions?: (positions: string[]) => void;

  // Gelecekteki ürünler için action'lar buraya eklenecek
}

// Product-specific tip döndüren yardımcı fonksiyon
export function getProductSpecificType(productId: string | null) {
  switch (productId) {
    case "panjur":
      return {} as PanjurSelections & Record<string, string | number | boolean>;
    case "kepenk":
      return {} as KepenkSelections & Record<string, string | number | boolean>;
    case "sineklik":
      // Gelecekte: return {} as SineklikSelections & ProductSpecificState;
      return {} as PanjurSelections & Record<string, string | number | boolean>;
    default:
      return {} as PanjurSelections & Record<string, string | number | boolean>;
  }
}
export function useProductState(productId: string | null): {
  state: ProductSpecificState;
  actions: ProductStateActions;
} {
  const dispatch = useDispatch();

  // Redux state selectors - sadece panjur için kullanılacak
  const shutterState = useSelector(
    (state: { shutter: ShutterState }) => state.shutter
  );

  switch (productId) {
    case "panjur":
      return {
        state: {
          middleBarPositions: shutterState.middleBarPositions,
          sectionHeights: shutterState.sectionHeights,
          sectionMotors: shutterState.sectionMotors,
          sectionConnections: shutterState.sectionConnections,
          sectionMotorPositions: shutterState.sectionMotorPositions,
        },
        actions: {
          setMiddleBarPositions: (positions: number[]) =>
            dispatch(setMiddleBarPositions(positions)),
          setSectionHeights: (heights: number[]) =>
            dispatch(setSectionHeights(heights)),
          setSectionMotors: (motors: boolean[]) =>
            dispatch(setSectionMotors(motors)),
          setSectionConnections: (connections: string[]) =>
            dispatch(setSectionConnections(connections)),
          setSectionMotorPositions: (positions: string[]) =>
            dispatch(setSectionMotorPositions(positions)),
        },
      };

    case "kepenk":
      // Kepenk için basit state (şimdilik panjur gibi)
      return {
        state: {},
        actions: {},
      };

    case "sineklik":
      // Gelecekte sineklik için özel state ve action'lar
      return {
        state: {},
        actions: {},
      };

    case "pergole":
      // Gelecekte pergole için özel state ve action'lar
      return {
        state: {},
        actions: {},
      };

    case "tente":
      // Gelecekte tente için özel state ve action'lar
      return {
        state: {},
        actions: {},
      };

    default:
      // Bilinmeyen ürün tipi için boş state
      return {
        state: {},
        actions: {},
      };
  }
}
