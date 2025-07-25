import Link from "next/link";

import { PenTool } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./_components/login-form";

export default function LoginPageV1() {
  return (
    <div className="flex min-h-screen items-center justify-center p-[var(--space-2)]">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-[var(--space-2)] pb-[var(--space-3)]">
            <div className="flex justify-center">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-lg">
                <PenTool className="text-primary-foreground h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-[var(--space-4)] pb-[var(--space-4)]">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
