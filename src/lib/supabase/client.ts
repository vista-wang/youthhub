import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return client;
}

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

export function fromTable<T extends TableName>(
  supabase: ReturnType<typeof createClient>,
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
