import { Popover } from "@headlessui/react";
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
import React, { useRef, useState } from "react";
import { Chip } from "./Chip";
import { useHotkeys } from "react-hotkeys-hook";

export function DatePicker({
  value,
  onChange,
  children,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);

  useHotkeys("d", () => buttonRef.current?.click(), {
    preventDefault: true,
  });
  useHotkeys("esc", () => setIsOpen(false), {
    enableOnTags: ["INPUT"],
  });

  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));

  const dates = [];
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

  const QuickChips = () => (
    <div className="flex gap-2 p-2 border-b border-white/10">
      <Chip onClick={() => onChange(new Date())}>Today</Chip>
      <Chip onClick={() => onChange(addDays(new Date(), 1))}>Tomorrow</Chip>
      <Chip onClick={() => onChange(nextMonday(new Date()))}>Next Monday</Chip>
      <Chip onClick={() => onChange(null)}>Clear</Chip>
    </div>
  );

  return (
    <Popover className="relative">
      {({ open, close }) => {
        if (isOpen !== open) {
          setIsOpen(open);
        }
        const handleChange = (date: Date | null) => {
          onChange(date);
          close();
        };
        return (
          <>
            <Popover.Button
              ref={buttonRef}
              as="div"
              className="focus:outline-none"
            >
              {children}
            </Popover.Button>
            <AnimatePresence>
              {open && (
                <Popover.Panel
                  static
                  as={motion.div}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-10 mt-2 w-72 rounded-lg bg-zinc-800 border border-white/10 shadow-lg focus:outline-none"
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
                              isSameDay(date, value || new Date()) &&
                              "bg-blue-500 text-white"
                            }
                            ${
                              !isSameDay(date, value || new Date()) &&
                              isToday(date) &&
                              "text-blue-400"
                            }
                            ${
                              date.getMonth() !== currentMonth.getMonth() &&
                              "text-zinc-500"
                            }
                          `}
                        >
                          {format(date, "d")}
                          {isToday(date) && (
                            <Dot
                              className="absolute bottom-0.5"
                              size={16}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </Popover.Panel>
              )}
            </AnimatePresence>
          </>
        );
      }}
    </Popover>
  );
}
