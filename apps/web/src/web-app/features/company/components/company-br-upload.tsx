"use client";

import { useWebUser } from "@jobboard/providers/web-user-provider";
import { DropzoneField } from "@components/dropzone-field";
import { Button } from "@ui/button";
import { IconCircleCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useController, useForm } from "react-hook-form";
import { uploadCompanyBrImage } from "../api/company.actions";

interface BrImageFormValues {
  image?: File;
}

export function CompanyBrUpload({ brImageUrl }: { brImageUrl: string | null }) {
  const [uploaded, setUploaded] = useState(!!brImageUrl);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { openLoginModal } = useWebUser();
  const form = useForm<BrImageFormValues>({
    defaultValues: { image: undefined },
  });
  const { field } = useController({ name: "image", control: form.control });
  const file = field.value;

  const handleUpload = () => {
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      const result = await uploadCompanyBrImage(file);
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setUploaded(!!result.brImageUrl);
      form.reset({ image: undefined });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        Business registration document{" "}
        <span className="text-muted-foreground">(optional)</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Upload a photo of your Business Registration certificate to help verify
        your company.
      </p>
      {uploaded ? (
        <p className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground">
          <IconCircleCheck className="size-4 text-emerald-600" />
          Business registration document uploaded
        </p>
      ) : (
        <>
          <DropzoneField
            control={form.control}
            name="image"
            accept={{ "image/*": [], "application/pdf": [] }}
            disabled={isPending}
            uploading={isPending}
            placeholder="Drag your business registration document here, or click to browse"
            fieldState={error ? { error: { message: error } } : undefined}
          />
          {file && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleUpload}
            >
              {isPending ? "Uploading…" : "Upload"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
