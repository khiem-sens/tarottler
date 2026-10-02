import "server-only";
import { cookies } from "next/headers";
import { sessionCookie, verifySession } from "./session";

export function cmsConfigured() {
  return !!process.env.CMS_ADMIN_PASSWORD_HASH && (process.env.CMS_SESSION_SECRET?.length ?? 0) >= 32;
}

export async function isAdmin() {
  return cmsConfigured() && verifySession((await cookies()).get(sessionCookie)?.value, process.env.CMS_SESSION_SECRET);
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
