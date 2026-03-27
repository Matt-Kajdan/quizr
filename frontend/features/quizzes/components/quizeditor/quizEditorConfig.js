import { DIFFICULTY_ICONS } from "@shared/assets/icons";

export const ANSWER_COUNT_OPTIONS = [2, 3, 4, 5, 6];
export const DEFAULT_ANSWERS_PER_QUESTION = 4;

export const QUIZ_EDITOR_CATEGORIES = [
  { value: "art", label: "Art" },
  { value: "history", label: "History" },
  { value: "music", label: "Music" },
  { value: "science", label: "Science" },
  { value: "other", label: "Other" },
];

export const QUIZ_EDITOR_DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    description: "Review every question after finishing, including the correct answers.",
    gradient: "from-emerald-500/80 via-emerald-500/80 to-emerald-500/80 dark:from-emerald-900/60 dark:via-emerald-900/60 dark:to-emerald-900/60",
    border: "border-emerald-400/50 dark:border-emerald-800/50",
    icon: DIFFICULTY_ICONS.easy,
  },
  {
    value: "medium",
    label: "Medium",
    description: "Review every question after finishing, showing which selections were right or wrong.",
    gradient: "from-amber-400/85 via-amber-400/85 to-amber-400/85 dark:from-amber-900/60 dark:via-amber-900/60 dark:to-amber-900/60",
    border: "border-amber-400/50 dark:border-amber-800/50",
    icon: DIFFICULTY_ICONS.medium,
  },
  {
    value: "hard",
    label: "Hard",
    description: "Only see the total number of correct answers after finishing.",
    gradient: "from-rose-500/85 via-rose-500/85 to-rose-500/85 dark:from-rose-900/60 dark:via-rose-900/60 dark:to-rose-900/60",
    border: "border-rose-400/50 dark:border-rose-800/50",
    icon: DIFFICULTY_ICONS.hard,
  },
];

export const QUIZ_EDITOR_CATEGORY_BAR_COLORS = {
  art: "bg-rose-200/80 dark:bg-rose-900/60 dark:text-rose-200",
  history: "bg-amber-200/80 dark:bg-amber-900/60 dark:text-amber-200",
  music: "bg-sky-200/80 dark:bg-sky-900/60 dark:text-sky-200",
  science: "bg-emerald-200/80 dark:bg-emerald-900/60 dark:text-emerald-200",
  other: "bg-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200",
};
