"use client";

import { useRouter } from "next/navigation";

import { EllipsisVertical, CircleUser, CreditCard, MessageSquareDot, LogOut, User, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";

interface UserData {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

const InitializingTrigger = () => (
  <div className="flex items-center gap-2">
    <Avatar className="h-8 w-8">
      <AvatarFallback>
        <CircleUser className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">Loading...</span>
      <span className="truncate text-xs">Please wait</span>
    </div>
  </div>
);

const SignedInTrigger = ({ user }: { user: UserData }) => (
  <div className="flex items-center gap-2">
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
      <AvatarFallback>
        {user.displayName?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? "U"}
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{user.displayName ?? "User"}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  </div>
);

const SignedOutTrigger = () => (
  <div className="flex items-center gap-2">
    <Avatar className="h-8 w-8">
      <AvatarFallback>
        <CircleUser className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">Guest</span>
      <span className="truncate text-xs">Not signed in</span>
    </div>
  </div>
);

const SignedInMenu = ({ handleLogout }: { handleLogout: () => void }) => {
  const router = useRouter();

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <CircleUser className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Account</span>
            <span className="truncate text-xs">Manage your account</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <CreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <MessageSquareDot />
        Support
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut />
        Log out
      </DropdownMenuItem>
    </>
  );
};

const SignedOutMenu = () => {
  const router = useRouter();

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <CircleUser className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Guest</span>
            <span className="truncate text-xs">Sign in to access features</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => router.push("/auth/v1/login")}>
        <User />
        Sign In
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push("/auth/v1/register")}>
        <CircleUser />
        Sign Up
      </DropdownMenuItem>
    </>
  );
};

export function MinimalNavUser() {
  const { user, logout, initializing } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          {initializing ? <InitializingTrigger /> : user ? <SignedInTrigger user={user} /> : <SignedOutTrigger />}
          <EllipsisVertical className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="right">
        {user ? <SignedInMenu handleLogout={handleLogout} /> : <SignedOutMenu />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 