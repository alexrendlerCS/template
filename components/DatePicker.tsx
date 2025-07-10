import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  placeholder?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = "mm/dd/yyyy",
  id,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    if (show) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [show]);

  // Helper to parse YYYY-MM-DD to local Date
  function parseLocalDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return (
    <div className="relative" ref={ref}>
      <input
        id={id}
        type="text"
        value={
          value
            ? (() => {
                const [year, month, day] = value.split("-").map(Number);
                return new Date(year, month - 1, day).toLocaleDateString();
              })()
            : ""
        }
        readOnly
        placeholder={placeholder}
        className="pr-10 pl-3 w-full h-10 cursor-pointer border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm font-normal"
        onClick={() => setShow((s) => !s)}
        autoComplete="off"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        <Calendar className="h-4 w-4 text-gray-500" />
      </button>
      {show && (
        <div className="absolute z-50 bg-white border rounded shadow mt-2 left-0">
          <DayPicker
            mode="single"
            selected={value ? parseLocalDateString(value) : undefined}
            onSelect={(date) => {
              setShow(false);
              if (date) {
                // Always use local date, never toISOString
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                onChange(`${year}-${month}-${day}`);
              }
            }}
            disabled={min ? { before: parseLocalDateString(min) } : undefined}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}
