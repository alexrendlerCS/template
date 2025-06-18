import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const createServerClient = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
      },
    }
  );
};

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for server-only mutations
);
