import { useEffect, useState } from "react";
import Modal from "./Modal";
import LabelInput from "./LabelInput";
import { TimerMode } from "../hooks/useTimer";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  workMin: number;
  breakMin: number;
  apiKey: string;
  onSave: (workMin: number, breakMin: number, apiKey: string) => void;
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  setSecs: (secs: number) => void;
};

export default function SettingsModal({
  open,
  onClose,
  workMin,
  breakMin,
  apiKey,
  onSave,
  mode,
  setMode,
  setSecs,
}: SettingsModalProps) {
  const [localWorkMin, setLocalWorkMin] = useState(workMin);
  const [localBreakMin, setLocalBreakMin] = useState(breakMin);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localMode, setLocalMode] = useState(mode);

  useEffect(() => {
    if (open) {
      setLocalWorkMin(workMin);
      setLocalBreakMin(breakMin);
      setLocalApiKey(apiKey);
      setLocalMode(mode);
    }
  }, [open, workMin, breakMin, apiKey, mode]);

  const handleSave = () => {
    onSave(localWorkMin, localBreakMin, localApiKey);
    setMode(localMode);
    setSecs(localMode === "focus" ? localWorkMin * 60 : localBreakMin * 60);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div className="p-4 border border-white/10 rounded-xl">
          <h3 className="text-lg font-medium text-zinc-100 mb-4">Timer</h3>
          <div className="grid grid-cols-2 gap-4">
            <LabelInput
              label="Focus"
              type="number"
              value={localWorkMin}
              onChange={(e) => setLocalWorkMin(Number(e.target.value))}
            />
            <LabelInput
              label="Break"
              type="number"
              value={localBreakMin}
              onChange={(e) => setLocalBreakMin(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="p-4 border border-white/10 rounded-xl">
          <h3 className="text-lg font-medium text-zinc-100 mb-4">
            Integrations
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <LabelInput
              label="OpenAI API Key"
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-zinc-500 px-1">
              Used for AI-powered features. You can find your key on the{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                className="text-blue-400 hover:underline"
              >
                OpenAI dashboard
              </a>
              .
            </p>
          </div>
        </div>

        <div className="p-4 border border-white/10 rounded-xl">
          <h3 className="text-lg font-medium text-zinc-100 mb-4">
            Default Session
          </h3>
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 rounded-lg py-2 text-sm border transition-colors ${
                localMode === "focus"
                  ? "bg-white text-black border-white/50"
                  : "bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setLocalMode("focus")}
            >
              Focus
            </button>
            <button
              className={`flex-1 rounded-lg py-2 text-sm border transition-colors ${
                localMode === "break"
                  ? "bg-white text-black border-white/50"
                  : "bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setLocalMode("break")}
            >
              Break
            </button>
          </div>
        </div>
      </div>
      <div slot="footer" className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm bg-white/5 text-zinc-200 border border-white/10 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="rounded-lg px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
