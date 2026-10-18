import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyJwtToken } from "@/lib/auth";

export default async function DashboardSettingsRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const payload = verifyJwtToken(token);
    if (
      payload.role === "super_admin" ||
      payload.role === "admin" ||
      payload.role === "staff"
    ) {
      redirect("/admin/settings");
    } else if (payload.role === "teacher") {
      redirect("/dashboard/teacher/profile");
    } else if (payload.role === "student" || payload.role === "guardian") {
      redirect("/dashboard/student/security");
    } else {
      redirect("/dashboard");
    }
  } catch {
    redirect("/login");
  }
}
