"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Fixed import
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn, getItemColor } from "@/lib/utils";

interface ItemInputListProps {
  label?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  suggestions?: Array<string | { value: string; label: string }>;
  id?: string;
}

export const ItemInputList: React.FC<ItemInputListProps> = ({
  label,
  placeholder = "...",
  items,
  onChange,
  suggestions = [],
  id,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedSuggestions = suggestions.map((s) =>
    typeof s === "string" ? { value: s, label: s } : s,
  );

  const labelByValue = new Map(
    normalizedSuggestions.map((s) => [s.value, s.label]),
  );

  const displayItem = (value: string) => labelByValue.get(value) ?? value;

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue("");
    }
  };

  useEffect(() => {}, [items, inputValue]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleSuggestionToggle = (suggestion: string, checked: boolean) => {
    if (checked) {
      if (!items.includes(suggestion)) {
        onChange([...items, suggestion]);
      }
    } else {
      onChange(items.filter((item) => item !== suggestion));
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleAdd} size="icon" disabled={!inputValue.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSuggestions((prev) => !prev)}
            className="h-8 text-xs"
          >
            {showSuggestions ? "-" : `${label} +`}
          </Button>
        </div>

        {showSuggestions && (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded bg-muted/20">
            {normalizedSuggestions.map((suggestion) => {
              const isChecked = items.includes(suggestion.value);
              return (
                <div
                  key={suggestion.value}
                  className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-muted/40 rounded transition-colors"
                >
                  <Checkbox
                    id={`${id}-suggestion-${suggestion.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleSuggestionToggle(suggestion.value, !!checked)
                    }
                  />
                  <label
                    htmlFor={`${id}-suggestion-${suggestion.value}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {suggestion.label}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, index) => {
            const itemText = displayItem(item);
            return (
              <Badge
                key={`${item}-${index}`}
                variant="outline"
                className={cn(
                  "pl-3 pr-1 py-1 gap-1 border-2 font-semibold shadow-sm",
                  getItemColor(itemText),
                )}
              >
                <span className="truncate max-w-[150px]">{itemText}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  className="h-5 w-5 p-0 hover:bg-transparent hover:text-foreground text-inherit opacity-70 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
