import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "@/config/constants";

export interface AuthUserState {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUserState | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUserState; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<AuthUserState>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setCredentials, updateUserProfile, setAuthLoading, logout } =
  authSlice.actions;

export default authSlice.reducer;
