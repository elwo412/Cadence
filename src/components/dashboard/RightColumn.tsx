import { Header } from "./Header";
import { TodosPane } from "./TodosPane";
import { MiniDayRail } from "../calendar/MiniDayRail";
import { BacklogBelt } from "./BacklogBelt";
import { todayISO } from "@/lib/utils";

export function RightColumn() {
  return (
    <div className="p-6 flex flex-col gap-6 h-full relative min-w-0">
      <Header />
      <div className="grid grid-cols-[1fr_auto] gap-6 flex-1 min-h-0">
        <TodosPane dateISO={todayISO()} />
        <MiniDayRail />
      </div>
      <BacklogBelt dateISO={todayISO()} />
    </div>
  );
}
