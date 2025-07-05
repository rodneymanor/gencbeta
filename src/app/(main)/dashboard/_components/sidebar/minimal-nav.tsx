"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

import { BrandProfileIndicator } from "./brand-profile-indicator";

interface MinimalNavProps {
  readonly items: readonly NavGroup[];
  readonly onCollectionCreated?: () => void;
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-gray-200 px-2 py-1 text-xs dark:text-gray-800">Soon</span>
);

const NavItem = ({
  item,
  isActive,
  onCollectionCreated,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  onCollectionCreated?: () => void;
}) => {
  const isBrandItem = item.title === "My Brand";

  return (
    <div key={item.title}>
      {item.subItems ? (
        <HoverCard openDelay={150} closeDelay={300}>
          <HoverCardTrigger asChild>
            <Button
              variant="ghost"
              disabled={item.comingSoon}
              className={`w-full justify-start ${isActive(item.url, item.subItems) ? 'bg-accent text-accent-foreground' : ''}`}
            >
              {item.icon && <item.icon className="h-4 w-4 mr-2" />}
              <span>{item.title}</span>
              {isBrandItem && <BrandProfileIndicator />}
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-60 space-y-1 p-2" side="right" align="start" sideOffset={8}>
            {item.subItems.map((subItem) => (
              <Button
                key={subItem.title}
                variant="ghost"
                asChild
                className={`w-full justify-start ${isActive(subItem.url) ? 'bg-accent text-accent-foreground' : ''}`}
                disabled={subItem.comingSoon}
              >
                <Link href={subItem.url} target={subItem.newTab ? "_blank" : undefined}>
                  {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                  <span>{subItem.title}</span>
                  {subItem.comingSoon && <IsComingSoon />}
                </Link>
              </Button>
            ))}
            {item.title === "Collections" && item.subItems.length === 1 && (
              <CreateCollectionDialog onCollectionCreated={onCollectionCreated}>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground w-full justify-start">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  <span>Create your first collection</span>
                </Button>
              </CreateCollectionDialog>
            )}
          </HoverCardContent>
        </HoverCard>
      ) : (
        <Button
          variant="ghost"
          asChild
          disabled={item.comingSoon}
          className={`w-full justify-start ${isActive(item.url) ? 'bg-accent text-accent-foreground' : ''}`}
        >
          <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
            {item.icon && <item.icon className="h-4 w-4 mr-2" />}
            <span>{item.title}</span>
            {isBrandItem && <BrandProfileIndicator />}
            {item.comingSoon && <IsComingSoon />}
          </Link>
        </Button>
      )}
    </div>
  );
};

export function MinimalNav({ items, onCollectionCreated }: MinimalNavProps) {
  const path = usePathname();

  const isItemActive = (url: string, subItems?: NavMainItem["subItems"]) => {
    if (subItems?.length) {
      return subItems.some((sub) => path.startsWith(sub.url));
    }
    return path === url;
  };

  return (
    <div className="space-y-6">
      {/* Write Script Button */}
      <div className="space-y-2">
        <Button
          asChild
          className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/dashboard/scripts/new">
            <Zap className="h-4 w-4 mr-2" />
            <span>Write Script</span>
          </Link>
        </Button>
      </div>

      {/* Navigation Groups */}
      {items.map((group) => (
        <div key={group.id} className="space-y-2">
          {group.label && (
            <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {group.label}
            </h3>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={isItemActive}
                onCollectionCreated={onCollectionCreated}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 