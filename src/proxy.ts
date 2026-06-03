import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve user session details safely
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const privateRoutes = [
    "/dashboard", 
    "/home", 
    "/camera", 
    "/scan", 
    "/coach", 
    "/diary", 
    "/analytics", 
    "/stats", 
    "/streaks", 
    "/settings",
    "/analysis",
    "/history",
    "/transformation"
  ];
  
  const isPrivateRoute = privateRoutes.some((route) => 
    request.nextUrl.pathname.startsWith(route)
  );

  // 1. Redirect unauthenticated users to /login if trying to access private routes
  if (!user && isPrivateRoute) {
    if (request.method === "GET") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Return 401 Unauthorized for API and server action POST requests
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Redirect authenticated users away from auth pages to /dashboard
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup" || request.nextUrl.pathname === "/forgot-password")) {
    if (request.method === "GET") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static assets)
     * - _next/image (image processing)
     * - favicon.ico (system icons)
     * - images folder inside public/
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
