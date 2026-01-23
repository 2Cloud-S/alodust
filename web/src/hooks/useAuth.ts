import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useAuth() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  // Get or create Convex user
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const upsertUser = useMutation(api.users.upsertFromClerk);
  const updateStatus = useMutation(api.users.updateStatus);

  // Sync Clerk user to Convex
  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser) {
      upsertUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        username:
          clerkUser.username ||
          clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          `user_${clerkUser.id.slice(0, 8)}`,
        displayName: clerkUser.fullName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
      });
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, upsertUser]);

  // Update status on visibility change
  useEffect(() => {
    if (!convexUser?._id) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateStatus({ userId: convexUser._id, status: "online" });
      } else {
        updateStatus({ userId: convexUser._id, status: "away" });
      }
    };

    const handleBeforeUnload = () => {
      updateStatus({ userId: convexUser._id, status: "offline" });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Set online when hook mounts
    updateStatus({ userId: convexUser._id, status: "online" });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [convexUser?._id, updateStatus]);

  return {
    // Auth state
    isLoaded: isClerkLoaded,
    isSignedIn: isSignedIn ?? false,

    // Clerk user (for auth)
    clerkUser,

    // Convex user (for app data)
    user: convexUser,
    userId: convexUser?._id,

    // Actions
    signOut,
  };
}
