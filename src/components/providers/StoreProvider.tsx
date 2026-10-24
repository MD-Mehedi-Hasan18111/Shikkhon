"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore, useAppDispatch, useAppSelector } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && json?.data) {
            dispatch(setCredentials({ user: json.data, token: "" }));
          }
        })
        .catch(() => {});
    }
  }, [user, dispatch]);

  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

