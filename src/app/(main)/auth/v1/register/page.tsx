import Link from "next/link";

import { PenTool } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { RegisterForm } from "./_components/register-form";

export default function RegisterPageV1() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-lg">
                <PenTool className="text-primary-foreground h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
