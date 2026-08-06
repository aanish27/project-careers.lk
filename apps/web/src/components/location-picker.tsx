"use client";

import {
  getCitiesForDistrict,
  getDistrictsForProvince,
  PROVINCES,
} from "@careerslk/types";
import { Field, FieldLabel } from "@ui/field";
import { useState } from "react";

const selectClassName =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

// Province -> District -> City cascading picker (city optional), used both
// by the public post-job form and the admin job-edit form so a job's
// location always resolves against the same fixed taxonomy the SEO location
// pages and AI scraper classification are keyed on.
export function LocationPicker({
  defaultProvince = "",
  defaultDistrict = "",
  defaultCity = "",
}: {
  defaultProvince?: string;
  defaultDistrict?: string;
  defaultCity?: string;
}) {
  const [province, setProvince] = useState(defaultProvince);
  const [district, setDistrict] = useState(defaultDistrict);
  const districts = getDistrictsForProvince(province || undefined);
  const cities = getCitiesForDistrict(district || undefined);

  return (
    <>
      <Field>
        <FieldLabel htmlFor="province" required>
          Province
        </FieldLabel>
        <select
          id="province"
          name="province"
          className={selectClassName}
          required
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setDistrict("");
          }}
        >
          <option value="" disabled>
            Select a province
          </option>
          {PROVINCES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="district" required>
          District
        </FieldLabel>
        <select
          key={province}
          id="district"
          name="district"
          className={selectClassName}
          required
          defaultValue={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={districts.length === 0}
        >
          <option value="" disabled>
            {districts.length === 0
              ? "Select a province first"
              : "Select a district"}
          </option>
          {districts.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="city">
          City <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <select
          key={district}
          id="city"
          name="city"
          className={selectClassName}
          defaultValue={defaultCity}
          disabled={cities.length === 0}
        >
          <option value="">
            {cities.length === 0 ? "Select a district first" : "Not specified"}
          </option>
          {cities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}
