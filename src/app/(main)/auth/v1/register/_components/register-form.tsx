"use client";

import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { PasswordValidation, SocialLogin, FormProgress, calculateProgress } from "./form-helpers";

const FormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50, { message: "Name must be less than 50 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one number." }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
    terms: z.boolean().refine((val) => val === true, { message: "You must accept the terms and privacy policy." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function RegisterFormV1() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    setValidationProgress(calculateProgress(watchedValues));
  }, [watchedValues]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    console.log("Registration data:", data);

    toast.success("Account created successfully!", {
      description: "Welcome to Script Writer! Please check your email to verify your account.",
    });
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success(`${provider === "google" ? "Google" : "GitHub"} signup successful!`, {
      description: "Welcome! Setting up your account...",
    });
  };

  return (
    <div className="space-y-6">
      <FormProgress progress={validationProgress} />
      <SocialLogin isLoading={isLoading} onSocialLogin={handleSocialLogin} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
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
                <FormLabel className="text-foreground text-sm font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                <PasswordValidation password={field.value || ""} />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="focus:ring-primary focus:border-primary h-11 pr-10 text-sm transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    id="register-terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1 h-4 w-4"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    htmlFor="register-terms"
                    className="text-muted-foreground cursor-pointer text-sm font-medium select-none"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-semibold underline"
                      onClick={() => toast.info("Terms of Service opened in new tab")}
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-semibold underline"
                      onClick={() => toast.info("Privacy Policy opened in new tab")}
                    >
                      Privacy Policy
                    </button>
                  </FormLabel>
                  <FormMessage className="text-xs" />
                </div>
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
                <span>Creating account...</span>
              </div>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
