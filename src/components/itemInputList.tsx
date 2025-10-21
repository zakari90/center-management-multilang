"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"; // Fixed import
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

interface ItemInputListProps {
  label?: string
  placeholder?: string
  items: string[]
  onChange: (items: string[]) => void
  suggestions?: string[]
}

export const ItemInputList: React.FC<ItemInputListProps> = ({
  label,
  placeholder = "...",
  items,
  onChange,
  suggestions = [],
}) => {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
      setInputValue("")
    }
  }

  useEffect(() => {
  }, [items, inputValue])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleSuggestionToggle = (suggestion: string, checked: boolean) => {
    if (checked) {
      if (!items.includes(suggestion)) {
        onChange([...items, suggestion])
      }
    } else {
      onChange(items.filter((item) => item !== suggestion))
    }
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
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
        <div className="flex items-center justify-between">
          <Label></Label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSuggestions((prev) => !prev)}
          >
            {showSuggestions ? "-" : `${label} +`}
          </Button>
        </div>

        {showSuggestions && (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
            {suggestions.map((suggestion) => {
              const isChecked = items.includes(suggestion)
              return (
                <label
                  key={suggestion}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleSuggestionToggle(suggestion, !!checked)
                    }
                  />
                  <span className="text-sm">{suggestion}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li
              key={index}
              className="p-2 bg-muted rounded-md text-sm flex justify-between items-center"
            >
              <span>{item}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}