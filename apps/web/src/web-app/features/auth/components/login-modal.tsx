"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ui/dialog";
import { EmailOtpForm } from "@web-app-features/auth/components/email-otp-form";
import { GoogleLoginButton } from "@web-app-features/auth/components/google-login-button";
import { useWebUser } from "@jobboard/providers/web-user-provider";

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginModalNext } = useWebUser();

  return (
    <Dialog
      open={isLoginModalOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginModal();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            You need to be signed in to do that.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <GoogleLoginButton next={loginModalNext} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
          <EmailOtpForm next={loginModalNext} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
