import { redirect } from "next/navigation";
import { cmsConfigured, isAdmin } from "@/features/cms/lib/auth";
import LoginForm from "@/features/cms/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm configured={cmsConfigured()} />;
}
