"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define available themes with TweakCN-inspired options
const themes = [
  { name: "light", label: "Light", description: "Clean and bright" },
  { name: "dark", label: "Dark", description: "Easy on the eyes" },
  { name: "tangerine", label: "Tangerine", description: "Warm and vibrant" },
  { name: "ocean", label: "Ocean", description: "Cool and calming" },
  { name: "forest", label: "Forest", description: "Natural and fresh" },
  { name: "sunset", label: "Sunset", description: "Warm gradient feel" },
];

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const currentIcon = resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          {currentIcon}
          <Palette className="text-muted-foreground absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Theme Selector</p>
            <p className="text-muted-foreground text-xs">
              Choose your preferred theme
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.name}
            onClick={() => setTheme(themeOption.name)}
            className="cursor-pointer flex items-center justify-between p-2"
          >
            <div className="flex items-center space-x-3">
              <div
                className="border-border h-4 w-4 rounded-full border-2"
                style={{
                  backgroundColor: `hsl(var(--${themeOption.name}-primary))`,
                }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {themeOption.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {themeOption.description}
                </span>
              </div>
            </div>
            {theme === themeOption.name && (
              <Check className="text-primary h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://tweakcn.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground flex cursor-pointer items-center space-x-2 text-xs"
          >
            <Palette className="h-3 w-3" />
            <span>Create custom themes with TweakCN</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
