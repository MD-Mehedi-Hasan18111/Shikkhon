import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from "@/lib/auth";

export const POST = createApiHandler(
  async () => {
    const response = apiSuccess(null, "সফলভাবে লগআউট করা হয়েছে।");

    // Clear Auth Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    // Clear CSRF Cookie
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: "",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  },
  { requireDb: false }
);
