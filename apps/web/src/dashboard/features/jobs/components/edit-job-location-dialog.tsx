"use client";

import { LocationPicker } from "@components/location-picker";
import { Button } from "@ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/dialog";
import type { JobDetail } from "@careerslk/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateJob } from "../hooks/use-update-job";

interface LocationFormValues {
  province: string;
  district: string;
  city: string;
}

export function EditJobLocationDialog({ job }: { job: JobDetail }) {
  const [open, setOpen] = useState(false);
  const updateJob = useUpdateJob();
  const form = useForm<LocationFormValues>({
    defaultValues: {
      province: job.province ?? "",
      district: job.district ?? "",
      city: job.city ?? "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateJob.mutate(
      {
        id: job.id,
        body: {
          province: data.province || undefined,
          district: data.district || undefined,
          city: data.city || undefined,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Edit location
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit location</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <LocationPicker
            control={form.control}
            disabled={updateJob.isPending}
          />
          <DialogFooter>
            <Button type="submit" disabled={updateJob.isPending}>
              {updateJob.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
