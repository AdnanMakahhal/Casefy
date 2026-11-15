import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const homeForRole = (role) => ["admin", "manager"].includes(role) ? "/admin" : "/dashboard";
