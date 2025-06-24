"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Github, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginFormV1() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    // Use data parameter to avoid linting warning
    console.log("Form data:", data);

    toast.success("Login successful!", {
      description: "Welcome back! Redirecting to your dashboard...",
    });
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    // Simulate social login
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success(`${provider === "google" ? "Google" : "GitHub"} login successful!`, {
      description: "Welcome! Setting up your account...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
          className="hover:bg-accent hover:text-accent-foreground h-11 text-sm font-medium transition-colors"
        >
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("github")}
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
          <span className="bg-background text-muted-foreground px-2">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">Email Address</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="focus:ring-primary focus:border-primary h-11 text-sm transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-foreground text-sm font-medium">Password</FormLabel>
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                    onClick={() => toast.info("Password reset link sent to your email!")}
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="focus:ring-primary focus:border-primary h-11 pr-10 text-sm transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                <FormControl>
                  <Checkbox
                    id="login-remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                  />
                </FormControl>
                <FormLabel
                  htmlFor="login-remember"
                  className="text-muted-foreground cursor-pointer text-sm font-medium select-none"
                >
                  Remember me for 30 days
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-full text-sm font-medium transition-colors"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
