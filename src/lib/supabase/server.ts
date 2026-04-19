import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

interface CreateClientOptions {
  useServiceRole?: boolean;
}

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  };
};

async function createSupabaseClient(options: CreateClientOptions = {}) {
  const { useServiceRole = false } = options;
  const cookieStore = await cookies();

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  const supabaseKey = useServiceRole ? supabaseServiceKey : supabaseAnonKey;

  if (!supabaseKey) {
    throw new Error(
      useServiceRole
        ? "Missing SUPABASE_SERVICE_ROLE_KEY"
        : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    ...(useServiceRole && {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  });
}

export async function createClient() {
  return createSupabaseClient();
}

export async function getServiceClient() {
  return createSupabaseClient({ useServiceRole: true });
}

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

export function fromTable<T extends TableName>(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  table: T
) {
  type Insert = Tables[T]["Insert"];
  type Update = Tables[T]["Update"];

  const query = supabase.from(table);

  return {
    select: query.select.bind(query),
    insert: (values: Insert | Insert[]) => query.insert(values as never),
    update: (values: Update) => query.update(values as never),
    upsert: (values: Insert | Insert[], options?: { onConflict?: string }) =>
      query.upsert(values as never, options as never),
    delete: query.delete.bind(query),
  };
}
