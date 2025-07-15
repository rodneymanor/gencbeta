"use client";

import { useRouter } from "next/navigation";

import { CircleUser, Crown, CreditCard, MessageSquareDot, LogOut, User, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";

interface UserData {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

function ProfileWithBadgeInline({
  user,
  accountLevel,
  initializing,
}: {
  user: UserData | null;
  accountLevel: string;
  initializing: boolean;
}) {
  const isPro = accountLevel === "pro";

  if (initializing) {
    return (
      <div className="flex items-center justify-center">
        <div className="bg-primary/10 flex h-9 w-9 animate-pulse items-center justify-center rounded-lg">
          <CircleUser className="text-muted-foreground h-4 w-4 transition-transform hover:scale-110" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <User className="text-muted-foreground h-5 w-5 transition-transform hover:scale-110" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-muted-foreground">Not signed in</div>
          <div className="text-muted-foreground text-xs">Click to sign in</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <CircleUser className="text-muted-foreground h-5 w-5 transition-transform hover:scale-110" />
        </div>
        <div
          className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] shadow-sm ${
            isPro ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {isPro ? (
            <Crown className="h-2 w-2 transition-transform hover:scale-110" />
          ) : (
            <User className="h-2 w-2 transition-transform hover:scale-110" />
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-muted-foreground">{user.displayName ?? "User"}</div>
        <div className="text-muted-foreground truncate text-xs">{user.email}</div>
      </div>
    </div>
  );
}

function SignedInMenu({ handleLogout }: { handleLogout: () => void }) {
  const router = useRouter();

  const handleSettingsClick = () => {
    router.push("/dashboard/settings");
  };

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <CircleUser className="transition-transform hover:scale-110" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="transition-transform hover:scale-110" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MessageSquareDot className="transition-transform hover:scale-110" />
          Notifications
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="transition-transform hover:scale-110" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="transition-transform hover:scale-110" />
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
    <DropdownMenuItem onClick={handleSignIn}>
      <LogOut className="transition-transform hover:scale-110" />
      Sign in
    </DropdownMenuItem>
  );
}

export function NavUser() {
  const { user, logout, initializing, accountLevel } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="w-full rounded-lg">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <ProfileWithBadgeInline user={user} accountLevel={accountLevel} initializing={initializing} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 rounded-lg" side="top" align="start" sideOffset={8}>
          {user ? <SignedInMenu handleLogout={handleLogout} /> : <SignedOutMenu />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
