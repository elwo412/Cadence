import React from "react";
import { RefineSuggestion } from "../../types/composer";
import {
  GitMerge,
  GitPullRequestArrow,
  GitPullRequestDraft,
  ArrowRight,
} from "lucide-react";

const KIND_ICON = {
  update: GitPullRequestArrow,
  split: GitMerge,
  merge: GitPullRequestDraft,
};

type SuggestionCardProps = {
  suggestion: RefineSuggestion;
};

const FieldChange = ({
  label,
  oldVal,
  newVal,
}: {
  label: string;
  oldVal?: any;
  newVal?: any;
}) => {
  if (newVal === undefined || newVal === oldVal) return null;
  return (
    <div className="flex items-center text-xs">
      <span className="font-medium text-zinc-400 w-16">{label}</span>
      {oldVal !== undefined && (
        <span className="text-zinc-500 line-through mr-2">{oldVal}</span>
      )}
      <ArrowRight size={12} className="text-zinc-500 mr-2" />
      <span className="text-emerald-300">{newVal}</span>
    </div>
  );
};

export const SuggestionCard = ({ suggestion }: SuggestionCardProps) => {
  const Icon = KIND_ICON[suggestion.kind] || GitPullRequestDraft;

  return (
    <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-sm">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={16} className="text-zinc-400" />
        <span className="font-medium text-zinc-200 capitalize">
          {suggestion.kind}
        </span>
      </div>
      {suggestion.reason && (
        <p className="text-xs text-zinc-400 mb-2 italic">
          "{suggestion.reason}"
        </p>
      )}

      {suggestion.kind === "update" && suggestion.updates && (
        <div className="space-y-1 pl-8">
          <FieldChange label="Title" newVal={suggestion.updates.title} />
          <FieldChange label="Est" newVal={suggestion.updates.est} />
          <FieldChange
            label="Priority"
            newVal={suggestion.updates.priority}
          />
          <FieldChange
            label="Tags"
            newVal={suggestion.updates.tags?.join(", ")}
          />
        </div>
      )}

      {suggestion.kind === "split" && suggestion.split && (
        <div className="pl-8 space-y-1">
          {suggestion.split.map((task, i) => (
            <p key={i} className="text-xs text-amber-300">
              - {task.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
