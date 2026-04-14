import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

/**
 * A reusable, accessible dropdown component.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - The element that triggers the dropdown.
 * @param {React.ReactNode} props.children - The content of the dropdown menu.
 * @param {string} props.align - Alignment of the dropdown menu: 'left', 'right', 'top', 'bottom'. Default: 'right'.
 * @param {string} props.className - Custom className for the container.
 * @param {string} props.contentClassName - Custom className for the dropdown content.
 */
export default function Dropdown({ 
  trigger, 
  children, 
  align = "right", 
  className,
  contentClassName 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
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

  const alignmentClasses = {
    left: "left-0 mt-2 origin-top-left",
    right: "right-0 mt-2 origin-top-right",
    top: "bottom-full mb-2 left-0 origin-bottom-left",
    "top-right": "bottom-full mb-2 right-0 origin-bottom-right",
    bottom: "top-full mt-2 left-0 origin-top-left",
  };

  return (
    <div className={cn("relative inline-block text-left w-full", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer select-none"
      >
        {trigger}
      </div>

      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 min-w-[200px] rounded-lg bg-white border border-slate-200 p-1 shadow-lg focus:outline-none animate-in fade-in zoom-in duration-100",
            alignmentClasses[align],
            contentClassName
          )}
          onClick={() => setIsOpen(false)} // Close on item click
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Sub-component for Dropdown Items
 */
export function DropdownItem({ children, onClick, className, variant = "default", icon: Icon }) {
  const variants = {
    default: "text-slate-700 hover:bg-slate-100",
    danger: "text-red-600 hover:bg-red-50",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

/**
 * Sub-component for Dropdown Dividers
 */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-slate-100" />;
}

/**
 * Sub-component for Dropdown Headers
 */
export function DropdownHeader({ children, className }) {
  return (
    <div className={cn("px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}
