import { AppShell } from "@/components/app-shell";
import { BlockGuard } from "@/components/block-guard";
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <BlockGuard />
      {children}
    </AppShell>
  );
}
