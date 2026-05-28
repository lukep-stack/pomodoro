import { useEffect, useState } from "react";
import Tooltip from "../Tooltip/Tooltip";
import "./SessionDots.css";

interface SessionDotsProps {
  count: number;
  onReset: () => void;
  isActive?: boolean;
  secondsLeft?: number;
}

export default function SessionDots({
  count,
  onReset,
  isActive,
  secondsLeft = 0,
}: SessionDotsProps) {
  const filled = count > 0 && count % 4 === 0 ? 4 : count % 4;
  const [animDelay, setAnimDelay] = useState(0);

  useEffect(() => {
    if (isActive) {
      setAnimDelay(secondsLeft % 2);
    }
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

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
              className={`session-dot${i < filled ? " session-dot--filled" : ""}${isActive && i === filled && filled < 4 ? " session-dot--active" : ""}`}
              style={
                isActive && i === filled && filled < 4
                  ? { animationDelay: `-${animDelay}s` }
                  : undefined
              }
            />
          ))}
        </div>
      </Tooltip>
      {/* {count > 0 && ( */}
      <div className="session-dots-reset-container">
        <Tooltip text="Reset progress">
          <button
            className="session-dots-reset"
            onClick={onReset}
            aria-label="Reset progress"
          >
            ↺
          </button>
        </Tooltip>
      </div>
      {/* )} */}
    </div>
  );
}
