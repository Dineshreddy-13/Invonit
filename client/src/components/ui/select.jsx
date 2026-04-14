import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = ({
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  className,
  id,
  align = "bottom"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) =>
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayValue = selectedOption
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all",
          isOpen && "ring-2 ring-indigo-500"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-500")}>
          {displayValue}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-[100] max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100",
          align === "top" ? "bottom-full mb-1" : "top-full mt-1"
        )}>
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            const isSelected = val === value;

            return (
              <div
                key={val}
                onClick={() => {
                  onValueChange(val);
                  setIsOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 transition-colors",
                  isSelected && "bg-slate-50 text-indigo-600 font-medium"
                )}
              >
                {isSelected && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { Select };
