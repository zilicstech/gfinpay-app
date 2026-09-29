"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import { CatalogShowcase } from "@/features/sales/CatalogShowcase";
import type { CatalogCategory } from "@/features/sales/CatalogView";

export default function AgentCatalogPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<CatalogCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) api<CatalogCategory[]>("/api/v1/catalog", { token }).then(setRows).catch((e) => setError(formatApiError(e, "Could not load catalog")));
  }, [token]);

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      <CatalogShowcase categories={rows} />
    </div>
  );
}
