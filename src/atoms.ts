import { atomWithStorage } from "jotai/utils";
import type { Durations } from "./types";

export type Theme = "light" | "dark";
export const themeAtom = atomWithStorage<Theme>("pomodoro-theme", "dark");

export const DEFAULT_DURATIONS: Durations = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const durationsAtom = atomWithStorage<Durations>(
  "pomodoro-settings",
  DEFAULT_DURATIONS,
);

export const DEFAULT_ACTIVITIES = [
  "Nap",
  "Walk",
  "Clean",
  "Pet",
  "Fitness",
  "Dishes",
];

export const activityListAtom = atomWithStorage<string[]>(
  "pomodoro-chores",
  DEFAULT_ACTIVITIES,
);
export const activitySelectionAtom = atomWithStorage<string | null>(
  "pomodoro-chore-selection",
  null,
);
export const recentActivitiesAtom = atomWithStorage<string[]>(
  "pomodoro-recent-chores",
  [],
);

export const pomodoroCountAtom = atomWithStorage<number>("pomodoro-count", 0);
export const autoAdvanceAtom = atomWithStorage<boolean>(
  "pomodoro-auto-advance",
  false,
);
