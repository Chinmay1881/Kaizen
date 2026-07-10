import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />;
}
