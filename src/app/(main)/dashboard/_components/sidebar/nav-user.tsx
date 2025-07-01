"use client";

import { useRouter } from "next/navigation";

import { EllipsisVertical, CircleUser, CreditCard, MessageSquareDot, LogOut, User, Settings } from "lucide-react";

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

function InitializingTrigger() {
  return (
    <>
      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg animate-pulse">
        <CircleUser className="text-primary h-4 w-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium animate-pulse">Loading...</span>
        <span className="text-muted-foreground truncate text-xs animate-pulse">Authenticating...</span>
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

function SignedInMenu({ handleLogout }: { handleLogout: () => void }) {
  const router = useRouter();

  const handleSettingsClick = () => {
    router.push("/dashboard/settings");
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center justify-center px-1 py-1.5">
          <UserAvatar />
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
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings />
          Settings
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
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/auth/v1/login");
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center justify-center px-1 py-1.5">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            <User className="text-muted-foreground h-4 w-4" />
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignIn}>
        <LogOut />
        Sign in
      </DropdownMenuItem>
    </>
  );
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, logout, initializing } = useAuth();

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
              {initializing ? (
                <InitializingTrigger />
              ) : user ? (
                <SignedInTrigger user={user} />
              ) : (
                <SignedOutTrigger />
              )}
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {user ? <SignedInMenu handleLogout={handleLogout} /> : <SignedOutMenu />}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
