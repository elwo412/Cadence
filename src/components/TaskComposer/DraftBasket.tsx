import { ParsedTask, RefineSuggestion } from "../../types/composer";
import { Checkbox } from "../Checkbox"; // Assuming a simple Checkbox component exists
import { SuggestionCard } from "./SuggestionCard";

type DraftBasketProps = {
  tasks: ParsedTask[];
  suggestions: RefineSuggestion[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClear: () => void;
};

export default function DraftBasket({
  tasks,
  suggestions,
  selectedIds,
  onSelectionChange,
  onClear,
}: DraftBasketProps) {
  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      const taskIds = tasks.map((_t, i) => `task-${i}`);
      const suggestionIds = suggestions.map((_s, i) => `sug-${i}`);
      onSelectionChange([...taskIds, ...suggestionIds]);
    }
  };

  const handleToggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const hasTasks = tasks.length > 0;
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col h-[350px]">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="font-medium text-zinc-200">Draft Basket</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAll}
            className="text-xs text-zinc-400 hover:text-white"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={onClear}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 mt-3 space-y-2 overflow-auto pr-1">
        {!hasTasks && !hasSuggestions && (
          <p className="text-sm text-zinc-500 mt-2 text-center pt-8">
            AI suggestions will appear here.
          </p>
        )}
        {hasTasks &&
          tasks.map((task, i) => {
            const id = `task-${i}`;
            return (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <Checkbox
                  id={id}
                  checked={selectedIds.includes(id)}
                  onCheckedChange={() => handleToggleOne(id)}
                />
                <label
                  htmlFor={id}
                  className="flex-1 text-sm text-zinc-300 cursor-pointer"
                >
                  {task.title}
                </label>
              </div>
            );
          })}
        {hasSuggestions && (
          <div className="space-y-2">
            {suggestions.map((sug, i) => {
              const id = `sug-${i}`;
              return (
                <div key={id} className="flex items-start gap-3">
                  <div className="pt-3">
                    <Checkbox
                      id={id}
                      checked={selectedIds.includes(id)}
                      onCheckedChange={() => handleToggleOne(id)}
                    />
                  </div>
                  <div className="flex-1">
                    <SuggestionCard suggestion={sug} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
