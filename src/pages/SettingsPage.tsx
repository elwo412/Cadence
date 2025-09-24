import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import usePlanner from "@/state/planner";
import { exportTasksToMarkdown } from "@/lib/export";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const tasks = usePlanner((s) => s.tasks);
  const fetchTasks = usePlanner((s) => s.fetchTasks);
  const fetchBlocks = usePlanner((s) => s.fetchBlocks);

  const handlePurge = async () => {
    try {
      await invoke("purge_all_data");
      // Refetch data or reload the app to reflect the changes
      fetchTasks();
      fetchBlocks(new Date().toISOString().split('T')[0]);
      // Or simply location.reload();
    } catch (error) {
      console.error("Failed to purge data:", error);
    }
  };

  const handleExport = () => {
    const markdown = exportTasksToMarkdown(tasks);
    navigator.clipboard.writeText(markdown);
    toast.success("Tasks copied to clipboard!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>

      <div className="mt-8 border-t border-zinc-800 pt-8">
        <h2 className="text-lg font-semibold text-zinc-200">Data</h2>
        <div className="mt-4">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-zinc-200 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Export Tasks to Markdown
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 border-2 border-red-500/30 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-zinc-400 mt-2">
          These actions are irreversible. Please be certain before proceeding.
        </p>
        <div className="mt-4">
          <button
            onClick={() => setIsPurgeConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            Purge All Data
          </button>
        </div>
      </div>

      <ConfirmationDialog
        open={isPurgeConfirmOpen}
        onClose={() => setIsPurgeConfirmOpen(false)}
        onConfirm={handlePurge}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete all your data."
        confirmText="Yes, purge everything"
      />
    </div>
  );
}
