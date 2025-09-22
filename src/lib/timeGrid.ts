import { DayBlock, Task } from "../types";

export const DRAG_DATA_KEY = "application/cadence-dnd";

export type DragData = {
  type: "TASK" | "BLOCK";
  task?: Task;
  block?: DayBlock;
};

export const yToSlot = (
  y: number,
  containerTop: number,
  slotHeight: number
): number => {
  return Math.floor((y - containerTop) / slotHeight);
};

export const snapToGrid = (
  deltaY: number,
  slotHeight: number,
  snapThreshold = 0.5
) => {
  const anom = deltaY / slotHeight;
  const rem = anom % 1;
  if (rem > snapThreshold) {
    return Math.ceil(anom) * slotHeight;
  }
  return Math.floor(anom) * slotHeight;
};
