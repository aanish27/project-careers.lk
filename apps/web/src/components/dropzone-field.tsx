"use client";

import { cn } from "@/lib/utils";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@ui/attachment";
import { FieldError } from "@ui/field";
import { IconCloudUpload, IconFile, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

interface DropzoneFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  /** Store `File[]` on the field instead of a bare `File | undefined`. */
  multiple?: boolean;
  /** Only relevant when `multiple`. */
  maxFiles?: number;
  accept?: Accept;
  maxSize?: number;
  disabled?: boolean;
  /** Drives each Attachment's shimmering "uploading" state. */
  uploading?: boolean;
  placeholder?: string;
  /** Extra error to merge in (e.g. a server-side error for this field). */
  fieldState?: { error?: { message?: string } };
}

// Generic drag-and-drop file field wired into react-hook-form, with
// Attachment-based previews (image thumbnail when the file is an image,
// generic file icon otherwise). Not tied to any one feature — usable
// anywhere a form needs a single file or a small set of them. The field's
// own value type isn't statically known here (it's whatever the caller's
// zod schema says — a bare `File` or a `File[]`), so it's read/written as
// `unknown` and reshaped internally based on `multiple`.
export function DropzoneField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  multiple = false,
  maxFiles = 1,
  accept,
  maxSize,
  disabled,
  uploading,
  placeholder = "Drag a file here, or click to browse",
  fieldState: extraFieldState,
}: DropzoneFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({ name, control });
  const [rejectionError, setRejectionError] = useState<string | undefined>();

  const files: File[] = useMemo(() => {
    if (!field.value) return [];
    return Array.isArray(field.value) ? field.value : [field.value];
  }, [field.value]);

  // Recomputed whenever the field's files change; the effect below revokes
  // the previous render's URLs (and the current ones on unmount) so nothing
  // outlives the render that created it.
  const previewUrls = useMemo(() => {
    const map = new Map<File, string>();
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        map.set(file, URL.createObjectURL(file));
      }
    }
    return map;
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.values()) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  const setFiles = (next: File[]) => {
    field.onChange(multiple ? next : (next[0] ?? undefined));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    disabled,
    onDrop: (accepted: File[]) => {
      setRejectionError(undefined);
      if (accepted.length === 0) return;
      setFiles(
        multiple ? [...files, ...accepted].slice(0, maxFiles) : [accepted[0]],
      );
    },
    onDropRejected: (rejections: FileRejection[]) => {
      setRejectionError(rejections[0]?.errors[0]?.message);
    },
  });

  const removeFile = (file: File) => {
    setFiles(files.filter((f) => f !== file));
  };

  const error =
    fieldState.error ??
    extraFieldState?.error ??
    (rejectionError ? { message: rejectionError } : undefined);

  const canAddMore = multiple ? files.length < maxFiles : files.length === 0;

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <AttachmentGroup>
          {files.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            return (
              <Attachment
                key={`${file.name}-${index}`}
                state={uploading ? "uploading" : "idle"}
              >
                <AttachmentMedia variant={isImage ? "image" : "icon"}>
                  {isImage ? (
                    <Image
                      src={previewUrls.get(file) ?? ""}
                      alt={file.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <IconFile />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatFileSize(file.size)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    aria-label="Remove file"
                    disabled={disabled}
                    onClick={() => removeFile(file)}
                  >
                    <IconX />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            );
          })}
        </AttachmentGroup>
      )}

      {canAddMore && (
        <Attachment
          {...getRootProps()}
          state="idle"
          className={cn(
            "w-full cursor-pointer justify-center",
            isDragActive && "bg-muted/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <input {...getInputProps()} />
          <AttachmentMedia>
            <IconCloudUpload />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{placeholder}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      )}

      <FieldError errors={[error]} />
    </div>
  );
}
