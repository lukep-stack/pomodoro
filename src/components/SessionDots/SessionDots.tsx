import Tooltip from "../Tooltip/Tooltip";
import "./SessionDots.css";

interface SessionDotsProps {
  count: number;
  onReset: () => void;
}

export default function SessionDots({ count, onReset }: SessionDotsProps) {
  const filled = count > 0 && count % 4 === 0 ? 4 : count % 4;
  return (
    <div className="session-dots-row">
      <Tooltip text="Pomodoro progress (4 dots = 1 set)">
        <div
          className="session-dots"
          aria-label={`${filled} of 4 pomodoros complete`}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={`session-dot${i < filled ? " session-dot--filled" : ""}`}
            />
          ))}
        </div>
      </Tooltip>
      {/* {count > 0 && ( */}
      <div className="session-dots-reset-container">
        <Tooltip text="Reset session count">
          <button
            className="session-dots-reset"
            onClick={onReset}
            aria-label="Reset session count"
          >
            ↺
          </button>
        </Tooltip>
      </div>
      {/* )} */}
    </div>
  );
}
