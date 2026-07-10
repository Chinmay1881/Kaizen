import { auth } from "@clerk/nextjs/server";

export async function getAuthToken(): Promise<string | null> {
  const session = await auth();
  return session.getToken();
}
