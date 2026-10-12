"use client";

import { SignInScreen } from "@/features/auth/SignInScreen";

export default function LoginPage() {
  return (
    <SignInScreen
      title="Partner Login"
      subtitle="Sign in with your mobile number or GFIN user code to open your desk."
      panelTitle="Turn your shop into a Digital Bank & ATM"
      panelBody="Offer money transfers, bill payments, cash withdrawals, and credit cards directly from your counter."
    />
  );
}
