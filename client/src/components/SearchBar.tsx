"use client";

import { SearchIcon, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="relative flex items-center">
      <SearchIcon className="absolute left-3 w-5 h-5 text-gray-500" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

