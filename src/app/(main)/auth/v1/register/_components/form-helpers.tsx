import { Check, X, Mail, Github } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function PasswordValidation({ password }: { password: string }) {
  const rules = [
    { rule: "At least 8 characters", valid: password.length >= 8 },
    { rule: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { rule: "One lowercase letter", valid: /[a-z]/.test(password) },
    { rule: "One number", valid: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {rules.map((rule, index) => (
        <div key={index} className="flex items-center space-x-2 text-xs">
          {rule.valid ? <Check className="h-3 w-3 text-green-500" /> : <X className="text-muted-foreground h-3 w-3" />}
          <span className={rule.valid ? "text-green-600" : "text-muted-foreground"}>{rule.rule}</span>
        </div>
      ))}
    </div>
  );
}

export function SocialLogin({
  isLoading,
  onSocialLogin,
}: {
  isLoading: boolean;
  onSocialLogin: (provider: "google" | "github") => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => onSocialLogin("google")}
          disabled={isLoading}
          className="hover:bg-accent hover:text-accent-foreground h-11 text-sm font-medium transition-colors"
        >
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => onSocialLogin("github")}
          disabled={isLoading}
          className="hover:bg-accent hover:text-accent-foreground h-11 text-sm font-medium transition-colors"
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or create account with email</span>
        </div>
      </div>
    </>
  );
}

export function FormProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Form completion</span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

export function calculateProgress(values: any) {
  const checks = [
    values.name && values.name.length >= 2,
    values.email && z.string().email().safeParse(values.email).success,
    values.password &&
      values.password.length >= 8 &&
      /[A-Z]/.test(values.password) &&
      /[a-z]/.test(values.password) &&
      /[0-9]/.test(values.password),
    values.confirmPassword && values.password === values.confirmPassword,
    values.terms,
  ];

  const completed = checks.filter(Boolean).length;
  return (completed / checks.length) * 100;
}
