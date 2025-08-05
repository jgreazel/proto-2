import { useState, useEffect } from "react";
import { api } from "~/utils/api";

interface SeasonTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SeasonTypeahead({
  value,
  onChange,
  placeholder = "Enter season year...",
  disabled = false,
  className = "input input-bordered w-full",
}: SeasonTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear().toString();
  const [inputValue, setInputValue] = useState(value || currentYear);

  // Sync input value with controlled value
  useEffect(() => {
    setInputValue(value || currentYear);
  }, [value, currentYear]);

  const { data: existingSeasons = [] } = api.passes.getAllSeasons.useQuery();

  // Generate some suggested years (current year and next few years)
  const currentYearNum = new Date().getFullYear();
  const suggestedYears = Array.from({ length: 5 }, (_, i) =>
    (currentYearNum + i).toString(),
  );

  // Combine existing seasons with suggested years, remove duplicates, and sort
  const allSuggestions = Array.from(
    new Set([...existingSeasons, ...suggestedYears]),
  ).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending (newest first)

  // Filter suggestions based on input
  const filteredSuggestions = allSuggestions.filter((season: string) =>
    season.toLowerCase().includes(inputValue.toLowerCase()),
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
                {existingSeasons.includes(suggestion) ? (
                  <span className="text-xs text-success">✓ exists</span>
                ) : (
                  <span className="text-xs text-info">suggested</span>
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
                  <span>Use &quot;{inputValue}&quot;</span>
                  <span className="text-xs text-primary">custom</span>
                </div>
              </button>
            )}
        </div>
      )}
    </div>
  );
}
