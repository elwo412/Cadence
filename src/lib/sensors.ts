import { PointerSensor } from "@dnd-kit/core";

export class CustomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        return true;
      },
    },
  ];

  constructor(props: any) {
    super(props);
  }

  // We need to add the y coordinate to the event data
  protected getEventActivator(event: any): any {
    const activator = super.getEventActivator(event);
    if (activator) {
      return {
        ...activator,
        handler: (e: any, ...args: any) => {
          const handlerResult = activator.handler(e, ...args);
          if (handlerResult) {
            return {
              ...handlerResult,
              y: e.clientY,
            };
          }
          return handlerResult;
        },
      };
    }
    return activator;
  }
}
