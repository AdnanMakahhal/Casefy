import { createContext, useContext } from "react";
export const UndoDeletionContext = createContext(null);
export function useUndoDeletion() { return useContext(UndoDeletionContext); }
