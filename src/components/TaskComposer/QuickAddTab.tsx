import { ParsedTask } from "../../types/composer";
import { CompactAdd } from "../CompactAdd";
import { parseLines } from "../../lib/parsing";

type QuickAddTabProps = {
  onAccept: (tasks: ParsedTask[]) => void;
};

export const QuickAddTab = ({ onAccept }: QuickAddTabProps) => {
  return (
    <div>
      <CompactAdd
        placeholder="Add one or more tasks..."
        multiline
        onAdd={(text) => onAccept(parseLines(text))}
      />
      <div className="mt-2 text-xs text-zinc-500">
        Tip: Type "My new task ~30m #work p2" to add details.
      </div>
    </div>
  );
};
