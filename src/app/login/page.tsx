"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  LogIn,
  Lock,
  Phone,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { addNotification } from "@/store/slices/notificationSlice";
import { bn } from "@/config/bangla-strings";

const loginFormSchema = z.object({
  phone: z
    .string()
    .min(11, "মোবাইল নম্বর কমপক্ষে ১১ ডিজিট হতে হবে")
    .regex(
      /^(?:\+88|88)?(01[3-9]\d{8})$/,
      "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: ০১৭১১XXXXXX)"
    ),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

function getTargetRouteByRole(role?: string): string {
  if (role === "teacher") return "/dashboard/teacher";
  if (role === "student" || role === "guardian") return "/dashboard/student";
  if (role === "super_admin" || role === "admin" || role === "staff") return "/admin";
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already logged in, redirect directly to user's dashboard
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data?.role) {
          setIsRedirecting(true);
          const dest = getTargetRouteByRole(data.data.role);
          window.location.href = dest;
        }
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMsg = result.message || "প্রদত্ত মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।";
        setServerError(errorMsg);
        dispatch(
          addNotification({
            type: "error",
            title: "লগইন ব্যর্থ",
            message: errorMsg,
          })
        );
        return;
      }

      // Store in Redux Toolkit
      dispatch(
        setCredentials({
          user: result.data.user,
          token: result.data.token,
        })
      );

      dispatch(
        addNotification({
          type: "success",
          title: "স্বাগতম!",
          message: `${result.data.user.fullName}, আপনি সফলভাবে প্রবেশ করেছেন।`,
        })
      );

      setIsRedirecting(true);

      // Determine user's dashboard route
      const role = result.data.user?.role;
      let targetRoute = getTargetRouteByRole(role);

      // Check if redirect query param exists
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const redirectParam = params.get("redirect");
        if (
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//")
        ) {
          targetRoute = redirectParam;
        }
      }

      // Hard navigation ensures cookies are immediately attached to requests
      window.location.href = targetRoute;
    } catch {
      const errorMsg = "সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি। সংযোগ পরীক্ষা করুন।";
      setServerError(errorMsg);
      dispatch(
        addNotification({
          type: "error",
          title: "সংযোগ ত্রুটি",
          message: errorMsg,
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Bar Back Link */}
      <div className="max-w-7xl w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#00636b] transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{bn.publicNav.home}-এ ফিরে যান</span>
        </Link>
      </div>

      {/* Main Login Center Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-6">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <Image
              src="/images/logo.png"
              alt={bn.institution.name}
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#00636b] tracking-tight">
              {bn.institution.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{bn.institution.subTitle}</p>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#aa651d] bg-[#fef9ee] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
            <Sparkles className="h-3 w-3 text-[#c27a29]" />
            <span>{bn.institution.motto}</span>
          </div>
        </div>

        {/* Login Form Card */}
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="h-1 bg-[#00636b]" />

          <CardHeader className="pb-3 border-b-0">
            <h2 className="text-base font-bold text-slate-900">{bn.auth.loginTitle}</h2>
            <p className="text-xs text-slate-500">{bn.auth.loginSubtitle}</p>
          </CardHeader>

          <CardContent className="pt-2">
            {serverError && (
              <div className="mb-4">
                <Alert
                  variant="danger"
                  title="লগইন ত্রুটি"
                  onDismiss={() => setServerError(null)}
                >
                  {serverError}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={bn.auth.phoneLabel}
                placeholder={bn.auth.phonePlaceholder}
                type="tel"
                leftIcon={<Phone className="h-4 w-4" />}
                {...register("phone")}
                error={errors.phone?.message}
                helperText={bn.auth.phoneHelper}
              />

              <div className="space-y-1">
                <Input
                  label={bn.auth.passwordLabel}
                  placeholder={bn.auth.passwordPlaceholder}
                  type={showPassword ? "text" : "password"}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition"
                      aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#00636b] focus:ring-[#00636b] cursor-pointer"
                  />
                  <span>{bn.auth.rememberMe}</span>
                </label>

                <a
                  href="#"
                  className="text-[#00636b] hover:text-[#004f56] font-medium hover:underline"
                >
                  {bn.auth.forgotPassword}
                </a>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-[#00636b] hover:bg-[#004f56] text-white"
                size="lg"
                isLoading={isSubmitting || isRedirecting}
              >
                <LogIn className="h-4 w-4" />
                <span>{isRedirecting ? "প্রবেশ করা হচ্ছে..." : bn.auth.submitLogin}</span>
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col items-center gap-2 text-center text-xs text-slate-500 bg-slate-50/80 border-t border-slate-100 py-3.5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>নিরাপদ ও এনক্রিপ্টেড সংযোগ</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span>সহায়তার জন্য:</span>
              <a
                href={`tel:${bn.institution.phonesRaw[0]}`}
                className="font-bold text-[#00636b] hover:underline"
              >
                {bn.institution.phones[0]}
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto text-center space-y-2 text-xs text-slate-500 pb-2">
        <div className="flex items-center justify-center gap-1.5 text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-[#00636b]" />
          <span>{bn.institution.address}</span>
        </div>
        <p className="text-[11px] text-slate-400">
          সর্বস্বত্ব সংরক্ষিত © ২০২৬ {bn.institution.name}
        </p>
      </div>
    </div>
  );
}
