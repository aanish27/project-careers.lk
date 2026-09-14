"use client";

import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/avatar";
import { Button } from "@ui/button";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadCompanyLogo } from "../api/company.actions";

export function CompanyLogoUpload({
  logoUrl,
  companyName,
}: {
  logoUrl: string | null;
  companyName: string;
}) {
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { openLoginModal } = useWebUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(undefined);
  };

  const handleUpload = () => {
    if (!file) return;
    startTransition(async () => {
      const result = await uploadCompanyLogo(file);
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPreview(result.logoUrl);
      setFile(null);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-20">
        {preview && <AvatarImage src={preview} alt={companyName} />}
        <AvatarFallback>{companyName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {file ? file.name : "Choose logo"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {file && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleUpload}
          >
            {isPending ? "Uploading…" : "Upload logo"}
          </Button>
        )}
      </div>
    </div>
  );
}
