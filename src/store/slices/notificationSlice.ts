import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ToastNotification {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface NotificationState {
  notifications: ToastNotification[];
}

const initialState: NotificationState = {
  notifications: [],
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<ToastNotification, "id"> & { id?: string }>
    ) => {
      const id = action.payload.id || Math.random().toString(36).substring(2, 9);
      state.notifications.push({
        ...action.payload,
        id,
        duration: action.payload.duration ?? 4000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } =
  notificationSlice.actions;

export default notificationSlice.reducer;
