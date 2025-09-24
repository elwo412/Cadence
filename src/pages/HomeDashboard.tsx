import { LeftColumn } from "../components/dashboard/LeftColumn";
import { RightColumn } from "../components/dashboard/RightColumn";

export default function HomeDashboard() {
  return (
    <div className="grid grid-cols-[minmax(380px,420px)_1fr] h-full">
      <LeftColumn />
      <RightColumn />
    </div>
  )
}
