import Link from "next/link";

import { PenTool } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginFormV1 } from "./_components/login-form";

export default function LoginV1() {
  return (
    <div className="from-background via-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card/95 supports-[backdrop-filter]:bg-card/90 border-0 shadow-xl backdrop-blur">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <PenTool className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Sign in to your Script Writer account to continue crafting amazing stories
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="space-y-6">
              <LoginFormV1 />
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="register"
                    className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary hover:text-primary/80 underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:text-primary/80 underline underline-offset-4">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
