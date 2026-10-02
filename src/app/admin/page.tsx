import { redirect } from "next/navigation";
import { isAdmin } from "@/features/cms/lib/auth";
import { getContentStore } from "@/features/cms/lib/content";
import ContentStudio from "@/features/cms/components/content-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await isAdmin()) redirect("/admin/login");
  return <ContentStudio initialDocuments={await (await getContentStore()).list()} />;
}
