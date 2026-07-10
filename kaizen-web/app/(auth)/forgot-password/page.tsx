import { redirect } from "next/navigation";

/**
 * Clerk's <SignIn> widget (mounted at /sign-in) already implements the full "forgot password"
 * flow internally — requesting a reset code, verifying it, and setting a new password — via its
 * own "Forgot password?" link. That flow is state managed inside the widget itself and can only
 * be entered by clicking that link, not by deep-linking to a URL from a cold page load. So rather
 * than host a second, separate <SignIn> instance here (which previously rendered a fresh sign-in
 * start screen, not a reset form — effectively dead-ending the flow), this route just sends users
 * to the real entry point.
 */
export default function ForgotPasswordPage() {
  redirect("/sign-in");
}
