import { PointerEvent } from "react";
import { PointerSensor } from "@dnd-kit/core";

// This is a custom sensor that prevents text selection while dragging.
export class CustomPointerSensor extends PointerSensor {
  public autoScrollEnabled = false;

  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: PointerEvent<Element>) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLButtonElement
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}
