import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { BlockGuard } from "@/components/block-guard";
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <BlockGuard />
        {children}
      </AppShell>
    </AuthGuard>
  );
}
