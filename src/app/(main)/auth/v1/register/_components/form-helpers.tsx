import { Check, X, Mail, Github } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px" {...props}>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
