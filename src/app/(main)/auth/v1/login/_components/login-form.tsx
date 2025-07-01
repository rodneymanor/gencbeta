"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { GoogleIcon, GithubIcon } from "@/app/(main)/auth/v1/register/_components/form-helpers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    try {
      await signIn(values.email, values.password);
      toast.success("Login successful!");
      router.push("/dashboard/scripts/new");
    } catch (err) {
      const error = err as Error;
      const message = error.message;
      setError(message);
      toast.error(message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google successfully!");
      router.push("/dashboard/scripts/new");
    } catch (err) {
      const error = err as Error;
      const message = error.message;
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
      </div>

      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-center text-sm">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between pt-2">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-sm">Remember me</FormLabel>
                </FormItem>
              )}
            />
            <Link href="#" className="text-primary text-sm font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading}>
          <GoogleIcon className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button variant="outline" disabled>
          <GithubIcon className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>

      <p className="text-muted-foreground pt-2 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/v1/register" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
