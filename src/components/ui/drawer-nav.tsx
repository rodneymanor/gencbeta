"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DrawerNavProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerNav({ children, className }: DrawerNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 px-0">
        <div className="flex h-full flex-col">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default DrawerNav; 