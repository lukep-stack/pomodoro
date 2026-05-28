import type { Mode } from "../../types";
import "./ModeSelector.css";

interface ModeSelectorProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: { key: Mode; label: string }[] = [
  { key: "pomodoro", label: "pomodoro" },
  { key: "shortBreak", label: "short break" },
  { key: "longBreak", label: "long break" },
];

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          className={`mode-tab${mode === key ? " mode-tab--active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
