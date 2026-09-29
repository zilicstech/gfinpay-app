"use client";

import { HeroKirana } from "@/components/illustrations/HomeArt";
import { SignInScreen } from "@/features/auth/SignInScreen";

export default function LoginPage() {
  return (
    <SignInScreen
      title="Sign in"
      subtitle="Use your mobile number or your GFIN user code."
      panelTitle="Sign in and open your desk."
      panelBody="Admins, distributors, and retailers use this same login. There is no public signup."
      panel={<HeroKirana />}
    />
  );
}
