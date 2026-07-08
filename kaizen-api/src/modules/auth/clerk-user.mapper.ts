import type { WebhookEvent } from "@clerk/backend/webhooks";
import type { clerkClient } from "@clerk/express";

import { USER_ROLES, type UserRole } from "../../constants/roles.js";
import type { NormalizedClerkUser } from "./auth.types.js";

type UserWebhookPayload = Extract<WebhookEvent, { type: "user.created" | "user.updated" }>["data"];
type ClerkApiUser = Awaited<ReturnType<typeof clerkClient.users.getUser>>;

/** Reads `public_metadata.role` / `publicMetadata.role` so an admin can assign a role from the Clerk dashboard ahead of the Admin Panel existing. */
function extractRole(metadata: unknown): UserRole | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>).role;
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : undefined;
}

/** Normalizes the snake_case webhook JSON payload (`user.created` / `user.updated`). */
export function normalizeWebhookUser(data: UserWebhookPayload): NormalizedClerkUser {
  const primaryEmail =
    data.email_addresses.find((address) => address.id === data.primary_email_address_id) ??
    data.email_addresses[0];

  return {
    clerkId: data.id,
    email: primaryEmail?.email_address ?? "",
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    avatarUrl: data.image_url ?? null,
    role: extractRole(data.public_metadata),
  };
}

/** Normalizes the camelCase Backend API `User` resource (used by the just-in-time sync fallback). */
export function normalizeApiUser(user: ClerkApiUser): NormalizedClerkUser {
  const primaryEmail =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];

  return {
    clerkId: user.id,
    email: primaryEmail?.emailAddress ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    avatarUrl: user.imageUrl ?? null,
    role: extractRole(user.publicMetadata),
  };
}
