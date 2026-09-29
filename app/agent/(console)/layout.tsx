"use client";

import { AgentConsoleShell } from "@/features/shell/AgentConsoleShell";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentConsoleShell>{children}</AgentConsoleShell>;
}
