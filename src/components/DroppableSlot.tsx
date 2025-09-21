import { useDroppable } from "@dnd-kit/core";
// import React from "react";
import { DAY_START, parseHHMM, SLOT_MIN } from "../lib/time";

export function DroppableSlot({
  time,
  slotHeight,
}: {
  time: number;
  slotHeight: number;
}) {
  const { setNodeRef } = useDroppable({ id: `slot-${time}` });
  const dayStartMin = parseHHMM(DAY_START);
  const i = (time - dayStartMin) / SLOT_MIN;
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        top: i * slotHeight,
        left: 0,
        right: 0,
        height: slotHeight,
      }}
    />
  );
}
