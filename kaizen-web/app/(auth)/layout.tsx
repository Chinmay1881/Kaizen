import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-primary relative hidden flex-col justify-between p-12 text-white lg:flex">
        <div>
          <p className="text-2xl font-bold">Muliya Kaizan</p>
          <p className="mt-2 text-sm text-white/80">Continuous Improvement Platform</p>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Welcome back</h1>
          <p className="max-w-md text-white/80">
            Digitize your Kaizen process, track improvements, and build a culture of innovation
            across Muliya Gold &amp; Jewellers LLP.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">{children}</div>
    </div>
  );
}
