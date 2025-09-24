import { Popover, Portal, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  nextMonday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Dot } from "lucide-react";
import React, {
  cloneElement,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";

function DatePickerPanel({
  open,
  close,
  buttonRef,
  value,
  onChange,
  currentMonth,
  nextMonth,
  prevMonth,
  dates,
}: {
  open: boolean;
  close: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  value: Date | null;
  onChange: (date: Date | null) => void;
  currentMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  dates: Date[];
}) {
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: "absolute",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        zIndex: 10,
      });
    }
  }, [open, buttonRef]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const handleChange = (date: Date | null) => {
    onChange(date);
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          <PopoverPanel
            static
            as={motion.div}
            style={popoverStyle}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-72 rounded-lg bg-zinc-800 border border-white/10 shadow-lg focus:outline-none"
          >
            <div className="flex gap-2 p-2 border-b border-white/10">
              <button
                onClick={() => handleChange(new Date())}
                className="rounded bg-white/10 text-[10px] text-zinc-300 px-1.5 py-0.5 hover:bg-white/20"
              >
                Today
              </button>
              <button
                onClick={() => handleChange(addDays(new Date(), 1))}
                className="rounded bg-white/10 text-[10px] text-zinc-300 px-1.5 py-0.5 hover:bg-white/20"
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleChange(nextMonday(new Date()))}
                className="rounded bg-white/10 text-[10px] text-zinc-300 px-1.5 py-0.5 hover:bg-white/20"
              >
                Next Monday
              </button>
              <button
                onClick={() => handleChange(null)}
                className="rounded bg-white/10 text-[10px] text-zinc-300 px-1.5 py-0.5 hover:bg-white/20"
              >
                Clear
              </button>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-medium">
                  {format(currentMonth, "MMMM yyyy")}
                </div>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="font-medium text-zinc-400">
                    {day}
                  </div>
                ))}
                {dates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleChange(date)}
                    className={`
                      relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10
                      ${
                        value && isSameDay(date, value)
                          ? "bg-blue-500 text-white"
                          : ""
                      }
                      ${
                        (!value || !isSameDay(date, value)) && isToday(date)
                          ? "text-blue-400"
                          : ""
                      }
                      ${
                        date.getMonth() !== currentMonth.getMonth()
                          ? "text-zinc-500"
                          : ""
                      }
                    `}
                  >
                    {format(date, "d")}
                    {isToday(date) && (
                      <Dot className="absolute bottom-0.5" size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </PopoverPanel>
        </Portal>
      )}
    </AnimatePresence>
  );
}

export function DatePicker({
  value,
  onChange,
  children,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  children: React.ReactElement;
}) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);

  useHotkeys("d", () => buttonRef.current?.click(), {
    preventDefault: true,
  });

  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));

  const dates: Date[] = [];
  let day = start;
  while (day <= end) {
    dates.push(day);
    day = addDays(day, 1);
  }

  const nextMonth = () => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  };

  return (
    <Popover>
      {({ open, close }) => (
        <>
          <PopoverButton as={Fragment}>
            {cloneElement(children, { ref: buttonRef })}
          </PopoverButton>
          <DatePickerPanel
            open={open}
            close={close}
            buttonRef={buttonRef}
            value={value}
            onChange={onChange}
            currentMonth={currentMonth}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            dates={dates}
          />
        </>
      )}
    </Popover>
  );
}
