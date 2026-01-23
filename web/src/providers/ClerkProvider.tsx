import { ReactNode } from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn(
    "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. " +
    "Authentication will not work. Get your key at https://clerk.com"
  );
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // If no Clerk key, render children without auth (for development)
  if (!clerkPubKey) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={clerkPubKey}
      routerPush={(to: string) => navigate(to)}
      routerReplace={(to: string) => navigate(to, { replace: true })}
      appearance={{
        variables: {
          colorPrimary: "#00FFFF",
          colorBackground: "#1A1A24",
          colorText: "#FFFFFF",
          colorTextSecondary: "rgba(255, 255, 255, 0.7)",
          colorInputBackground: "#000000",
          colorInputText: "#FFFFFF",
          borderRadius: "6px",
        },
        elements: {
          card: {
            backgroundColor: "#1A1A24",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
          },
          headerTitle: {
            fontFamily: "'Orbitron', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "2px",
          },
          headerSubtitle: {
            color: "rgba(255, 255, 255, 0.7)",
          },
          formButtonPrimary: {
            background: "linear-gradient(90deg, #FF4D00 0%, #FF00FF 100%)",
            fontFamily: "'Orbitron', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "1px",
            "&:hover": {
              background: "linear-gradient(90deg, #00FFFF 0%, #9D00FF 100%)",
            },
          },
          formFieldInput: {
            backgroundColor: "#000000",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            "&:focus": {
              borderColor: "#00FFFF",
              boxShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
            },
          },
          footerActionLink: {
            color: "#00FFFF",
            "&:hover": {
              color: "#FF00FF",
            },
          },
          socialButtonsBlockButton: {
            backgroundColor: "#2A2A3A",
            border: "1px solid rgba(0, 255, 255, 0.2)",
            "&:hover": {
              backgroundColor: "#3A3A4A",
              borderColor: "#00FFFF",
            },
          },
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
