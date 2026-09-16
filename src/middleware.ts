import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anonKey || url.includes("[project-ref]")) {
    return null;
  }

  try {
    new URL(url);
    return { url, anonKey };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseConfig = getSupabaseConfig();
  if (!supabaseConfig) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[middleware] Supabase non configuré — auth désactivée en dev. Corrigez NEXT_PUBLIC_SUPABASE_URL dans .env.local",
      );
      return supabaseResponse;
    }
    return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
  }

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth/");
  const isApiRoute = pathname.startsWith("/api");
  const isCronRoute = pathname.startsWith("/api/cron");

  if (isCronRoute) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
