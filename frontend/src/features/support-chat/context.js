import { createContext, useContext } from "react";

export const SupportChatContext = createContext(null);
export function useSupportChat() {
  return useContext(SupportChatContext);
}
