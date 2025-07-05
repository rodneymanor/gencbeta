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
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="bg-primary/10 flex h-10 w-10 animate-pulse items-center justify-center rounded-lg">
            <CircleUser className="text-primary h-5 w-5" />
          </div>
          <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[9px] shadow-sm">
            <div className="h-1 w-1 animate-pulse rounded-full bg-gray-400" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="animate-pulse text-sm font-medium">Loading...</div>
          <div className="text-muted-foreground animate-pulse text-xs">Authenticating...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <User className="text-muted-foreground h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Not signed in</div>
          <div className="text-muted-foreground text-xs">Click to sign in</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <CircleUser className="text-primary h-5 w-5" />
        </div>
        <div
          className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] shadow-sm ${
            isPro ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {isPro ? <Crown className="h-2 w-2" /> : <User className="h-2 w-2" />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user.displayName ?? "User"}</div>
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
    <DropdownMenuItem onClick={handleSignIn}>
      <LogOut />
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
    <div className="w-full rounded-lg border bg-white p-3">
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
