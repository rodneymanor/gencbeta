"use client";

import {
  EllipsisVertical,
  CircleUser,
  CreditCard,
  MessageSquareDot,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/auth-context";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

interface UserData {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface LayoutSettings {
  variant: SidebarVariant;
  collapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
}

function UserAvatar() {
  return (
    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
      <CircleUser className="text-primary h-4 w-4" />
    </div>
  );
}

function SignedInTrigger({ user }: { user: UserData }) {
  return (
    <>
      <UserAvatar />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.displayName ?? "User"}</span>
        <span className="text-muted-foreground truncate text-xs">{user.email}</span>
      </div>
    </>
  );
}

function SignedOutTrigger() {
  return (
    <>
      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
        <User className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Not signed in</span>
        <span className="text-muted-foreground truncate text-xs">Click to sign in</span>
      </div>
    </>
  );
}

function SignedInMenu({
  user,
  handleLogout,
  layoutSettings,
}: {
  user: UserData;
  handleLogout: () => void;
  layoutSettings?: LayoutSettings;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserAvatar />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.displayName ?? "User"}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <CircleUser />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MessageSquareDot />
          Notifications
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {layoutSettings && (
          <Popover>
            <PopoverTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings />
                Layout Settings
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex flex-col gap-5">
                <div className="space-y-1.5">
                  <h4 className="text-sm leading-none font-medium">Layout Settings</h4>
                  <p className="text-muted-foreground text-xs">Customize your dashboard layout preferences.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Sidebar Variant</Label>
                    <ToggleGroup
                      className="w-full"
                      size="sm"
                      variant="outline"
                      type="single"
                      value={layoutSettings.variant}
                      onValueChange={(value) => handleValueChange("sidebar_variant", value)}
                    >
                      <ToggleGroupItem className="text-xs" value="inset" aria-label="Toggle inset">
                        Inset
                      </ToggleGroupItem>
                      <ToggleGroupItem className="text-xs" value="sidebar" aria-label="Toggle sidebar">
                        Sidebar
                      </ToggleGroupItem>
                      <ToggleGroupItem className="text-xs" value="floating" aria-label="Toggle floating">
                        Floating
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Sidebar Collapsible</Label>
                    <ToggleGroup
                      className="w-full"
                      size="sm"
                      variant="outline"
                      type="single"
                      value={layoutSettings.collapsible}
                      onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
                    >
                      <ToggleGroupItem className="text-xs" value="icon" aria-label="Toggle icon">
                        Icon
                      </ToggleGroupItem>
                      <ToggleGroupItem className="text-xs" value="offcanvas" aria-label="Toggle offcanvas">
                        OffCanvas
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Content Layout</Label>
                    <ToggleGroup
                      className="w-full"
                      size="sm"
                      variant="outline"
                      type="single"
                      value={layoutSettings.contentLayout}
                      onValueChange={(value) => handleValueChange("content_layout", value)}
                    >
                      <ToggleGroupItem className="text-xs" value="centered" aria-label="Toggle centered">
                        Centered
                      </ToggleGroupItem>
                      <ToggleGroupItem className="text-xs" value="full-width" aria-label="Toggle full-width">
                        Full Width
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          Toggle Theme
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut />
        Log out
      </DropdownMenuItem>
    </>
  );
}

function SignedOutMenu() {
  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            <User className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Not signed in</span>
            <span className="text-muted-foreground truncate text-xs">Please sign in to continue</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <a href="/auth/v1/login">
          <LogOut className="rotate-180" />
          Sign in
        </a>
      </DropdownMenuItem>
    </>
  );
}

export function NavUser({ layoutSettings }: { layoutSettings?: LayoutSettings }) {
  const { isMobile } = useSidebar();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {user ? <SignedInTrigger user={user} /> : <SignedOutTrigger />}
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {user ? (
              <SignedInMenu user={user} handleLogout={handleLogout} layoutSettings={layoutSettings} />
            ) : (
              <SignedOutMenu />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
