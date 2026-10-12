"use client";

import { AlertProvider } from "@/lib/use-alert";
import { ConfirmProvider } from "@/lib/use-confirm";
import { DeletePromptProvider } from "@/lib/use-delete-prompt";
import { UserProvider } from "./context/user-context";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AlertProvider>
        <ConfirmProvider>
          <DeletePromptProvider>{children}</DeletePromptProvider>
        </ConfirmProvider>
      </AlertProvider>
    </UserProvider>
  );
}
