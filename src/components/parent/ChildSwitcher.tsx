import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useParentContext } from '@/lib/store/parentStore';

export function ChildSwitcher() {
  const [open, setOpen] = useState(false);
  const { children, activeChild, setActiveChild, isLoading } = useParentContext();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!children.length) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        <User className="h-4 w-4 mr-2" />
        No children available
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {activeChild ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activeChild.avatar} alt={activeChild.name} />
                <AvatarFallback className="text-xs">
                  {activeChild.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{activeChild.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Select child...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search children..." />
          <CommandList>
            <CommandEmpty>No children found.</CommandEmpty>
            <CommandGroup>
              {children.map((child) => (
                <CommandItem
                  key={child.id}
                  value={child.name}
                  onSelect={() => {
                    setActiveChild(child.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={child.avatar} alt={child.name} />
                      <AvatarFallback className="text-xs">
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{child.name}</span>
                      <span className="text-xs text-muted-foreground">{child.grade}</span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeChild?.id === child.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
