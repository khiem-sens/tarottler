import { isAdmin, sameOrigin } from "@/features/cms/lib/auth";
import { getContentStore } from "@/features/cms/lib/content";
import { mutationSchema, localeSchema } from "@/features/cms/lib/schema";
import { ContentConflict, PublishValidation } from "@/features/cms/lib/store";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  if (!await isAdmin()) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const locale = localeSchema.safeParse(new URL(request.url).searchParams.get("lang") ?? "en");
  if (!locale.success) return Response.json({ error: "Invalid language." }, { status: 400 });
  const { id } = await context.params;
  const card = await (await getContentStore()).get(id, locale.data);
  return card ? Response.json(card, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Card not found." }, { status: 404 });
}

async function mutate(request: Request, context: Context, publish: boolean) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await isAdmin()) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const locale = localeSchema.safeParse(new URL(request.url).searchParams.get("lang") ?? "en");
  if (!locale.success) return Response.json({ error: "Invalid language." }, { status: 400 });
  try {
    const raw = await request.text();
    if (raw.length > 128000) return Response.json({ error: "Content is too large." }, { status: 413 });
    const body = JSON.parse(raw);
    const { id } = await context.params;
    const store = await getContentStore();
    if (!await store.get(id, locale.data)) return Response.json({ error: "Card not found." }, { status: 404 });
    if (publish) {
      if (!Number.isInteger(body.version) || body.version < 0) return Response.json({ error: "Invalid version." }, { status: 400 });
      return Response.json(await store.publish(id, body.version, locale.data));
    }
    const result = mutationSchema.safeParse(body);
    if (!result.success) return Response.json({ error: "Invalid content. Check field lengths and keywords." }, { status: 400 });
    return Response.json(await store.save(id, result.data.version, result.data.document, locale.data));
  } catch (error) {
    if (error instanceof ContentConflict) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof PublishValidation) return Response.json({ error: error.message }, { status: 422 });
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid request body." }, { status: 400 });
    console.error("CMS mutation failed", error);
    return Response.json({ error: "Unable to save. Your changes are still in the editor." }, { status: 500 });
  }
}

export function PUT(request: Request, context: Context) { return mutate(request, context, false); }
export function POST(request: Request, context: Context) { return mutate(request, context, true); }
