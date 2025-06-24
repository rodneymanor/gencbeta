"use client";

import { EllipsisVertical, CircleUser, CreditCard, MessageSquareDot, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

interface UserData {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

function UserAvatar({ user }: { user: UserData }) {
  return (
    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
      <CircleUser className="text-primary h-4 w-4" />
    </div>
  );
}

function SignedInTrigger({ user }: { user: UserData }) {
  return (
    <>
      <UserAvatar user={user} />
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

function SignedInMenu({ user, handleLogout }: { user: UserData; handleLogout: () => void }) {
  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserAvatar user={user} />
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

export function NavUser() {
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
            {user ? <SignedInMenu user={user} handleLogout={handleLogout} /> : <SignedOutMenu />}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
