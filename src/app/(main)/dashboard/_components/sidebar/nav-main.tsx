"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type NavGroup, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { SpeedWriteDialog } from "./speed-write-dialog";

interface NavMainProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function NavMain({ isCollapsed, toggleSidebar }: NavMainProps) {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<number | null>(() => {
    for (let i = 0; i < sidebarItems.length; i++) {
      for (let j = 0; j < sidebarItems[i].items.length; j++) {
        if (pathname.startsWith(sidebarItems[i].items[j].href)) {
          return i;
        }
      }
    }
    return null;
  });
  const [isSpeedWriteOpen, setIsSpeedWriteOpen] = useState(false);

  const handleToggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  const isLinkActive = (link: string) => {
    return pathname === link;
  };

  return (
    <nav className="flex h-full flex-col">
      <div className="flex-grow">
        {sidebarItems.map((section, sectionIndex) => (
          <Collapsible
            key={sectionIndex}
            open={openSection === sectionIndex}
            onOpenChange={() => handleToggleSection(sectionIndex)}
            className="mb-4"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">{section.title}</span>
                <ChevronRight
                  className={cn("h-4 w-4 transform transition-transform", openSection === sectionIndex && "rotate-90")}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1">
                {section.items.map((item, itemIndex) => (
                  <TooltipProvider key={itemIndex}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isLinkActive(item.href) ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span className={cn("truncate", isCollapsed && "hidden")}>{item.title}</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" align="center">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <div className="mt-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted w-full justify-start"
                onClick={() => setIsSpeedWriteOpen(true)}
              >
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <span className={cn("ml-4 text-sm font-medium", isCollapsed && "hidden")}>Speed Write</span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" className="bg-primary text-primary-foreground">
                Speed Write
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      <SpeedWriteDialog open={isSpeedWriteOpen} onOpenChange={setIsSpeedWriteOpen} />
    </nav>
  );
}
