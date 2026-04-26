import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Resolve a private storage path into a usable signed URL. */
export function useSignedUrl(bucket: "logos" | "signatures", path: string | null | undefined, expires = 3600) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(null); return; }
    supabase.storage.from(bucket).createSignedUrl(path, expires).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [bucket, path, expires]);

  return url;
}
