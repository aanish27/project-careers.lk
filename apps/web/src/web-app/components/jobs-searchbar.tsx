"use client";
import { Field, FieldGroup } from "@ui/field";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBriefcase, IconMapPin, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const JobsSearchBar = () => {
  const router = useRouter();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      location: formData.get("location") as string,
    };

    const params = new URLSearchParams({
      title: data.title,
      location: data.location,
    });

    router.push(`/jobs?${params}`);
  }

  return (
    <form
      className="flex w-full max-w-3xl items-center rounded-full bg-background p-2 text-3xl border-2"
      onSubmit={handleSubmit}
    >
      <FieldGroup className="flex flex-row items-center gap-1">
        <Field>
          <InputGroup
            className="border-0 rounded-none shadow-none flex  items-center gap-2
                has-[[data-slot=input-group-control]:focus-visible]:ring-0!
                has-[[data-slot=input-group-control]:focus-visible]:border-ring/0!"
          >
            <InputGroupInput placeholder="Job title" id="title" name="title" />
            <InputGroupAddon>
              <IconBriefcase className="size-5 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Separator orientation="vertical" />
        <Field>
          <InputGroup
            className="border-0 rounded-none shadow-none flex flex-1 items-center gap-2
                has-[[data-slot=input-group-control]:focus-visible]:ring-0!
                has-[[data-slot=input-group-control]:focus-visible]:border-ring/0!"
          >
            <InputGroupInput
              placeholder="Location"
              id="location"
              name="location"
            />
            <InputGroupAddon>
              <IconMapPin className="size-5 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Button type="submit" size="icon" className="font-bold rounded-full">
          <IconSearch />
        </Button>
      </FieldGroup>
    </form>
  );
};

export default JobsSearchBar;
