import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setToken, removeToken, getToken } from "@/lib/auth";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive?: boolean;
  imageUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Initialize state from localStorage if available
const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
  
  const token = getToken();
  return {
    user: null, // User will be fetched via API if token exists
    token: token,
    isAuthenticated: !!token,
  };
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      setToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      removeToken();
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

