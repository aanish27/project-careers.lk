"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmScrapeDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  /** Omit when controlling visibility externally via `open`/`onOpenChange`. */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmScrapeDialog({
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  children,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: ConfirmScrapeDialogProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="success"
            disabled={isPending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {isPending ? "Queuing…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
