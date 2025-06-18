import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },
        async set(
          name: string,
          value: string,
          options: Omit<ResponseCookie, "name" | "value">
        ) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(
          name: string,
          options: Omit<ResponseCookie, "name" | "value">
        ) {
          try {
            const cookieStore = await cookies();
            cookieStore.delete(name);
          } catch {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export const supabaseAdmin = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // use service role for server-only mutations
  {
    cookies: {
      async get(name: string) {
        try {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      async set(
        name: string,
        value: string,
        options: Omit<ResponseCookie, "name" | "value">
      ) {
        try {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      async remove(
        name: string,
        options: Omit<ResponseCookie, "name" | "value">
      ) {
        try {
          const cookieStore = await cookies();
          cookieStore.delete(name);
        } catch {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  }
);
