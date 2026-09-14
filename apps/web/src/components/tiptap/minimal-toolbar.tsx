"use client";

import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Editor } from "@tiptap/core";
import { ToolbarProvider } from "./toolbars/toolbar-provider";
import { BoldToolbar } from "./toolbars/bold";
import { ItalicToolbar } from "./toolbars/italic";
import { UnderlineToolbar } from "./toolbars/underline";
import { BulletListToolbar } from "./toolbars/bullet-list";
import { OrderedListToolbar } from "./toolbars/ordered-list";

export const MinimalToolbar = ({ editor }: { editor: Editor }) => {
  return (
    <div className="sticky top-0 z-20 flex w-full items-center gap-1 border-b bg-background px-2 py-0.5">
      <ToolbarProvider editor={editor}>
        <TooltipProvider>
          <BoldToolbar />
          <ItalicToolbar />
          <UnderlineToolbar />
          <Separator orientation="vertical" className="mx-1 h-7" />
          <BulletListToolbar />
          <OrderedListToolbar />
        </TooltipProvider>
      </ToolbarProvider>
    </div>
  );
};
