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
import { useUpdateJob } from "../hooks/use-update-job";

export function EditJobLocationDialog({ job }: { job: JobDetail }) {
  const [open, setOpen] = useState(false);
  const updateJob = useUpdateJob();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const province = formData.get("province");
    const district = formData.get("district");
    const city = formData.get("city");

    updateJob.mutate(
      {
        id: job.id,
        body: {
          province: typeof province === "string" ? province : undefined,
          district: typeof district === "string" ? district : undefined,
          city: typeof city === "string" && city ? city : undefined,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

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
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <LocationPicker
            defaultProvince={job.province ?? ""}
            defaultDistrict={job.district ?? ""}
            defaultCity={job.city ?? ""}
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
