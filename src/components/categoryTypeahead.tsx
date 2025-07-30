import { useState } from "react";
import { api } from "~/utils/api";

interface CategoryTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onCategoryCreated?: () => void;
}

export function CategoryTypeahead({
  value,
  onChange,
  placeholder = "Select or create category...",
  disabled = false,
  className = "input input-bordered w-full",
  onCategoryCreated,
}: CategoryTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const { data: categories = [] } = api.items.getCategories.useQuery();
  const createCategory = api.items.createCategory.useMutation({
    onSuccess: () => {
      onCategoryCreated?.();
    },
  });

  const predefinedCategories = [
    "Drinks",
    "Candy/Food",
    "Frozen Treats",
    "Snacks",
    "Merchandise",
  ];

  // Combine existing categories with predefined ones, remove duplicates
  const allSuggestions = Array.from(
    new Set([...categories, ...predefinedCategories]),
  ).sort() as string[];

  // Filter suggestions based on input
  const filteredSuggestions = allSuggestions.filter((cat: string) =>
    cat.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);

    // If this is a new category (not in existing categories), create it
    if (!categories.includes(suggestion)) {
      createCategory.mutate({ name: suggestion });
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />

      {isOpen && (filteredSuggestions.length > 0 || inputValue) && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-base-300 bg-base-100 shadow-lg">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <span>{suggestion}</span>
                {categories.includes(suggestion) ? (
                  <span className="text-xs text-success">✓ exists</span>
                ) : (
                  <span className="text-xs text-primary">+ create</span>
                )}
              </div>
            </button>
          ))}

          {inputValue &&
            !filteredSuggestions.some(
              (s: string) => s.toLowerCase() === inputValue.toLowerCase(),
            ) && (
              <button
                type="button"
                onClick={() => handleSuggestionClick(inputValue)}
                className="w-full border-t border-base-300 px-4 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span>Create &quot;{inputValue}&quot;</span>
                  <span className="text-xs text-primary">+ new</span>
                </div>
              </button>
            )}
        </div>
      )}
    </div>
  );
}
