import "./TimerDisplay.css";

interface TimerDisplayProps {
  secondsLeft: number;
  totalSeconds: number;
}

const RADIUS = 170;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({
  secondsLeft,
  totalSeconds,
}: TimerDisplayProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-display">
      <svg className="timer-ring" viewBox="0 0 350 350" aria-hidden="true">
        <circle className="timer-ring__track" cx="175" cy="175" r={RADIUS} />
        <circle
          className="timer-ring__fill"
          cx="175"
          cy="175"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 175 175)"
        />
      </svg>
      <span
        className="timer-display__time"
        aria-live="polite"
        aria-label={`${minutes} minutes ${seconds} seconds`}
      >
        {display}
      </span>
    </div>
  );
}
