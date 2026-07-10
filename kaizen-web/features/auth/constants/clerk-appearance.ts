/**
 * Clerk theming for the prebuilt <SignIn>/<SignUp> widgets. Values are mirrored from
 * app/globals.css (:root / .dark) rather than read from CSS variables, because Clerk's
 * `variables` are resolved once at render time and can't consume `var(...)` at runtime.
 */

const sharedElements = {
  rootBox: "w-full max-w-md",
  card: "shadow-lg rounded-2xl border",
  headerTitle: "text-2xl font-semibold",
  headerSubtitle: "text-muted-foreground",
  formFieldLabel: "text-sm font-medium",
  formFieldInput: "h-12 rounded-lg",
  formButtonPrimary:
    "h-12 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200",
  footerActionLink: "text-primary hover:text-primary/80 font-medium",
  identityPreviewEditButtonIcon: "text-primary",
} as const;

const lightVariables = {
  colorPrimary: "oklch(0.52 0.22 25)",
  colorDanger: "oklch(0.55 0.22 25)",
  colorSuccess: "oklch(0.62 0.17 145)",
  colorWarning: "oklch(0.75 0.15 65)",
  colorText: "oklch(0.145 0 0)",
  colorTextSecondary: "oklch(0.45 0 0)",
  colorBackground: "oklch(1 0 0)",
  colorInputBackground: "oklch(1 0 0)",
  colorInputText: "oklch(0.145 0 0)",
  borderRadius: "0.75rem",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
} as const;

const darkVariables = {
  ...lightVariables,
  colorPrimary: "oklch(0.58 0.22 25)",
  colorDanger: "oklch(0.55 0.22 25)",
  colorText: "oklch(0.96 0 0)",
  colorTextSecondary: "oklch(0.65 0 0)",
  colorBackground: "oklch(0.17 0 0)",
  colorInputBackground: "oklch(0.17 0 0)",
  colorInputText: "oklch(0.96 0 0)",
} as const;

export function getClerkAppearance(theme: "light" | "dark") {
  return {
    variables: theme === "dark" ? darkVariables : lightVariables,
    elements: sharedElements,
  };
}

/** Overrides Clerk's default English copy to match docs/product/02_PRODUCT_REQUIREMENTS.md (AUTH-001). */
export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to continue to Muliya Kaizan",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Join Muliya Kaizan to submit and track your improvement ideas",
    },
  },
  formFieldLabel__emailAddress: "Email",
  formFieldInputPlaceholder__emailAddress: "Enter your company email",
  formFieldLabel__password: "Password",
  formFieldInputPlaceholder__password: "Enter your password",
} as const;
