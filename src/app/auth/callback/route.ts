import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";

/**
 * OAuth proves identity only. A user without membership is sent to the join
 * request page; the organization administrator remains the approval authority.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values: { name: string; value: string; options?: Record<string, unknown> }[]) =>
        values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);

  const user = await prisma.user.findUnique({ where: { authUserId: data.user.id }, select: { id: true } });
  if (!user) {
    return NextResponse.redirect(`${origin}/join`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
