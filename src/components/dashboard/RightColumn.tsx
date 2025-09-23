import React from "react";
import { Header } from "./Header";
import { TodosPane } from "./TodosPane";
import { MiniDayRail } from "../calendar/MiniDayRail";

export function RightColumn() {
  return (
    <div className="p-6 flex flex-col gap-6 h-full relative">
      <Header />
      <div className="grid grid-cols-[1fr_auto] gap-6 flex-1 min-h-0">
        <TodosPane />
        <MiniDayRail />
      </div>
    </div>
  );
}
