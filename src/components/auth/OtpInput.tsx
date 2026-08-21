import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  onComplete?: (v: string) => void;
}

/**
 * Código OTP com caixas separadas, auto-avanço, backspace inteligente e paste.
 */
export function OtpInput({
  value,
  onChange,
  length = 4,
  autoFocus = true,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const lastFiredRef = useRef<string>('');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (disabled) return;
    if (value.length === length && onComplete && lastFiredRef.current !== value) {
      lastFiredRef.current = value;
      onComplete(value);
    }
    if (value.length < length) {
      lastFiredRef.current = '';
    }
  }, [value, length, onComplete, disabled]);

  const setDigit = (index: number, char: string) => {
    const clean = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(length, " ").split("");
    arr[index] = clean || " ";
    const next = arr.join("").replace(/\s+$/g, "").trimEnd();
    onChange(next.replace(/\s/g, ""));
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[index]) {
        arr[index] = "";
        onChange(arr.join(""));
      } else if (index > 0) {
        arr[index - 1] = "";
        onChange(arr.join(""));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const target = Math.min(pasted.length, length - 1);
    refs.current[target]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-2 border-input bg-background text-center text-2xl font-bold font-display",
            "transition-all outline-none",
            "focus:border-primary focus:ring-4 focus:ring-primary/20 focus:scale-105",
            value[i] && "border-primary/60 bg-primary/5",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
