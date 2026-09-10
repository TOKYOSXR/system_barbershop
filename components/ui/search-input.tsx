"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
}

/** URL-driven search box with debounce (updates the query param). */
export function SearchInput({
  placeholder = "Pesquisar...",
  paramName = "q",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const onChange = (next: string) => {
    setValue(next);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set(paramName, next);
      else params.delete(paramName);
      params.delete("page"); // reset to first page on new search
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
