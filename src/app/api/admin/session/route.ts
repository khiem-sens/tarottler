import { cookies } from "next/headers";
import { cmsConfigured, sameOrigin } from "@/features/cms/lib/auth";
import { createSession, sessionCookie, sessionSeconds, verifyPassword } from "@/features/cms/lib/session";
import { getContentStore } from "@/features/cms/lib/content";
import { loginSchema } from "@/features/cms/lib/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!cmsConfigured()) return Response.json({ error: "Admin login has not been configured." }, { status: 503 });
  try {
    const result = loginSchema.safeParse(await request.json());
    if (!result.success) return Response.json({ error: "Invalid password." }, { status: 400 });
    const body = result.data;
    if (!await (await getContentStore()).allowLogin()) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    if (!verifyPassword(body.password, process.env.CMS_ADMIN_PASSWORD_HASH!)) return Response.json({ error: "Incorrect password." }, { status: 401 });
    (await cookies()).set(sessionCookie, createSession(process.env.CMS_SESSION_SECRET!), {
      httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: sessionSeconds,
    });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Unable to sign in. Try again." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  (await cookies()).delete(sessionCookie);
  return Response.json({ ok: true });
}
