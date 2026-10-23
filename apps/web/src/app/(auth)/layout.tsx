// apps/web/src/app/(auth)/layout.tsx
import { AuthProvider } from "@/components/auth/auth-context";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthLayout>{children}</AuthLayout>
    </AuthProvider>
  );
}
