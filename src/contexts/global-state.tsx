"use client";
import { createContext, useContext, useState } from "react";

export type GlobalStateType = {
  middleBarPositions: number[];
  setMiddleBarPositions: (positions: number[]) => void;
  sectionHeights: number[];
  setSectionHeights: (heights: number[]) => void;
  // ileride başka global state'ler buraya eklenebilir
};

const GlobalStateContext = createContext<GlobalStateType | undefined>(
  undefined
);

export function GlobalStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [middleBarPositions, setMiddleBarPositions] = useState<number[]>([]);
  const [sectionHeights, setSectionHeights] = useState<number[]>([]);

  return (
    <GlobalStateContext.Provider
      value={{
        middleBarPositions,
        setMiddleBarPositions,
        sectionHeights,
        setSectionHeights,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext);
  if (!ctx)
    throw new Error("useGlobalState must be used within GlobalStateProvider");
  return ctx;
}
