"use client";

import { Badge } from "@/components/ui/badge";
import { IconCode, IconX } from "@tabler/icons-react";
import { useState } from "react";

type SkillsFilterProps = {
  skills: string[];
  onChange: (skills: string[]) => void;
};

const SkillsFilter = ({ skills, onChange }: SkillsFilterProps) => {
  const [input, setInput] = useState("");

  const addSkill = () => {
    const value = input.trim();
    if (value && !skills.includes(value)) {
      onChange([...skills, value]);
    }
    setInput("");
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-white px-4 py-2">
      <IconCode className="size-4 shrink-0 text-muted-foreground" />
      {skills.map((skill) => (
        <Badge key={skill} variant="secondary" className="gap-1">
          {skill}
          <button
            type="button"
            onClick={() => removeSkill(skill)}
            aria-label={`Remove ${skill} filter`}
          >
            <IconX className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
          }
        }}
        onBlur={addSkill}
        placeholder={skills.length ? "" : "Skills"}
        className="w-20 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
};

export default SkillsFilter;
