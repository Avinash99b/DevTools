import React from 'react';
import { useNavigate } from 'react-router';
import { Calculator, Calendar, Settings } from "lucide-react";
import devToolManager from '../core/DevToolManager';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const tools = devToolManager.getAllTools();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tools">
           {tools.map(tool => (
               <CommandItem key={tool.id} onSelect={() => {
                   setOpen(false);
                   navigate(`/tool/${tool.id}`);
               }}>
                   <Calculator className="mr-2 h-4 w-4" />
                   <span>{tool.name}</span>
               </CommandItem>
           ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { setOpen(false); navigate("/"); }}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); navigate("/settings"); }}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}