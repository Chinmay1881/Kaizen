import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect(ROUTES.DASHBOARD);
  }

  redirect(ROUTES.SIGN_IN);
}
