"use client";

import {
  getCitiesForDistrict,
  getDistrictsForProvince,
  PROVINCES,
} from "@careerslk/types";
import { Field, FieldError, FieldLabel } from "@ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

interface LocationPickerProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  disabled?: boolean;
}

// Province -> District -> City cascading picker (city optional), used both
// by the public post-job form and the admin job-edit dialog so a job's
// location always resolves against the same fixed taxonomy the SEO location
// pages and AI scraper classification are keyed on. Always binds to the
// canonical `province`/`district`/`city` field names on the given form.
export function LocationPicker<TFieldValues extends FieldValues = FieldValues>({
  control,
  disabled,
}: LocationPickerProps<TFieldValues>) {
  const province = useController({
    name: "province" as FieldPath<TFieldValues>,
    control,
  });
  const district = useController({
    name: "district" as FieldPath<TFieldValues>,
    control,
  });
  const city = useController({
    name: "city" as FieldPath<TFieldValues>,
    control,
  });

  const provinceValue = (province.field.value as string) || "";
  const districtValue = (district.field.value as string) || "";
  const cityValue = (city.field.value as string) || "";
  const districts = getDistrictsForProvince(provinceValue || undefined);
  const cities = getCitiesForDistrict(districtValue || undefined);

  return (
    <>
      <Field data-invalid={province.fieldState.invalid}>
        <FieldLabel htmlFor="province" required>
          Province
        </FieldLabel>
        <Select
          name="province"
          required
          disabled={disabled}
          value={provinceValue || null}
          onValueChange={(value) => {
            province.field.onChange(value ?? "");
            district.field.onChange("");
            city.field.onChange("");
          }}
        >
          <SelectTrigger
            id="province"
            className="w-full"
            aria-invalid={province.fieldState.invalid}
          >
            <SelectValue placeholder="Select a province" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PROVINCES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError errors={[province.fieldState.error]} />
      </Field>

      <Field data-invalid={district.fieldState.invalid}>
        <FieldLabel htmlFor="district" required>
          District
        </FieldLabel>
        <Select
          name="district"
          required
          disabled={disabled || districts.length === 0}
          value={districtValue || null}
          onValueChange={(value) => {
            district.field.onChange(value ?? "");
            city.field.onChange("");
          }}
        >
          <SelectTrigger
            id="district"
            className="w-full"
            aria-invalid={district.fieldState.invalid}
          >
            <SelectValue
              placeholder={
                districts.length === 0
                  ? "Select a province first"
                  : "Select a district"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {districts.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError errors={[district.fieldState.error]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="city">
          City <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Select
          name="city"
          disabled={disabled || cities.length === 0}
          value={cityValue || null}
          onValueChange={(value) => city.field.onChange(value ?? "")}
        >
          <SelectTrigger id="city" className="w-full">
            <SelectValue
              placeholder={
                cities.length === 0
                  ? "Select a district first"
                  : "Not specified"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {cities.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}
