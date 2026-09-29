"use client";

import { FormEvent } from "react";
import { FormModal } from "@/features/admin/AdminChrome";

export function EkycComingSoonModal({
  open,
  title = "eKYC",
  onClose,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
}) {
  function dismiss(e: FormEvent) {
    e.preventDefault();
    onClose();
  }

  return (
    <FormModal
      open={open}
      title={title}
      description="Feature coming soon"
      onClose={onClose}
      onSubmit={dismiss}
      submitLabel="OK"
    >
      <p className="text-sm text-navy-600">
        Digital KYC is not available yet. You will be able to complete verification here when it launches.
      </p>
    </FormModal>
  );
}
