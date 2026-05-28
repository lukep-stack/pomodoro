import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useAtom } from "jotai";
import {
  activityListAtom,
  activitySelectionAtom,
  recentActivitiesAtom,
  themeAtom,
} from "../../atoms";
import Button from "../Button/Button";
import ActivitySettings from "../ActivitySettings/ActivitySettings";
import "./ActivityWheel.css";
import Tooltip from "../Tooltip/Tooltip";

export interface ActivityWheelHandle {
  spin: () => void;
}

const RAINBOW = [
  "#FF6B6B",
  "#FF9E4A",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#C77DFF",
];

// Darker variants with sufficient contrast for white text (WCAG AA)
const RAINBOW_DARK = [
  "#B03030",
  "#B85A10",
  "#8A6E08",
  "#1E7A40",
  "#1A4E9E",
  "#6A2E9E",
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function getHighlightedIndex(rotation: number, count: number): number {
  if (count === 0) return -1;
  const TWO_PI = 2 * Math.PI;
  const sliceAngle = TWO_PI / count;
  const normalized = ((-rotation % TWO_PI) + TWO_PI) % TWO_PI;
  return Math.floor(normalized / sliceAngle) % count;
}

function brighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${nr},${ng},${nb})`;
}

const SPIN_DURATION = 2000;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const ActivityWheel = forwardRef<ActivityWheelHandle, {}>((_props, ref) => {
  const [activities] = useAtom(activityListAtom);
  const [activitySelection, setActivitySelection] = useAtom(
    activitySelectionAtom,
  );
  const [recentActivities, setRecentActivities] = useAtom(recentActivitiesAtom);
  const [theme] = useAtom(themeAtom);
  const [showSettings, setShowSettings] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<number>(0);
  const isSpinningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    const isDark = theme === "dark";

    ctx.clearRect(0, 0, size, size);

    if (activities.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#2a2a2a" : "#e0e0e0";
      ctx.fill();
      ctx.fillStyle = isDark ? "#888" : "#999";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add activities below", cx, cy);
      drawPointer(ctx, cx, size, isDark);
      return;
    }

    const sliceAngle = (2 * Math.PI) / activities.length;
    const rotation = rotationRef.current;
    const palette = isDark ? RAINBOW_DARK : RAINBOW;
    const dividerColor = isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
    const textColor = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.75)";
    const hlIndex = getHighlightedIndex(rotation, activities.length);

    // Pass 1: fill all non-highlighted slices
    for (let i = 0; i < activities.length; i++) {
      if (i === hlIndex) continue;
      const startAngle = rotation + i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = palette[i % palette.length];
      ctx.fill();
    }

    // Pass 2: highlighted slice last so its glow bleeds onto neighbors
    {
      const startAngle = rotation + hlIndex * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      const baseColor = palette[hlIndex % palette.length];
      const lightColor = RAINBOW[hlIndex % RAINBOW.length];
      ctx.save();
      ctx.shadowColor = isDark ? lightColor : brighten(lightColor, 0.45);
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = brighten(baseColor, 0.18);
      ctx.fill();
      ctx.restore();
    }

    // Pass 3: dividers and labels on top of all fills
    for (let i = 0; i < activities.length; i++) {
      const startAngle = rotation + i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.strokeStyle = dividerColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const midAngle = startAngle + sliceAngle / 2;
      const textRadius = radius * 0.85;
      const tx = cx + textRadius * Math.cos(midAngle);
      const ty = cy + textRadius * Math.sin(midAngle);

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = textColor;
      ctx.font = `bold ${clampFontSize(activities.length)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(truncate(activities[i], 12), 0, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPointer(ctx, cx, size, isDark);
  }, [activities, theme]);

  function drawPointer(
    ctx: CanvasRenderingContext2D,
    cx: number,
    size: number,
    isDark: boolean,
  ) {
    const tipY = 18;
    const baseY = 2;
    const halfBase = 9;
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - halfBase, baseY);
    ctx.lineTo(cx + halfBase, baseY);
    ctx.closePath();
    ctx.fillStyle = isDark ? "#ffffff" : "#1a1a1a";
    ctx.fill();
    void size;
  }

  function clampFontSize(count: number): number {
    if (count <= 4) return 16;
    if (count <= 8) return 14;
    return 12;
  }

  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  useEffect(() => {
    const maxLen = Math.floor(activities.length / 2);
    setRecentActivities((prev) => prev.slice(0, maxLen));
  }, [activities.length, setRecentActivities]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const spin = useCallback(() => {
    if (isSpinningRef.current || activities.length === 0) return;
    isSpinningRef.current = true;

    const sliceAngle = (2 * Math.PI) / activities.length;
    const recentSet = new Set(recentActivities);
    const eligible = activities
      .map((_, i) => i)
      .filter((i) => !recentSet.has(activities[i]));
    const pool = eligible.length > 0 ? eligible : activities.map((_, i) => i);
    const winnerIndex = pool[Math.floor(Math.random() * pool.length)];

    const TWO_PI = 2 * Math.PI;
    const startRotation = rotationRef.current;

    const targetMod =
      ((-(winnerIndex * sliceAngle + sliceAngle / 2) % TWO_PI) + TWO_PI) %
      TWO_PI;
    const startMod = ((startRotation % TWO_PI) + TWO_PI) % TWO_PI;
    const delta = (targetMod - startMod + TWO_PI) % TWO_PI;
    const extraFullTurns = (3 + Math.floor(Math.random() * 3)) * TWO_PI;
    const targetRotation = startRotation + extraFullTurns + delta;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOutCubic(t);

      rotationRef.current =
        startRotation + eased * (targetRotation - startRotation);
      drawWheel();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = targetRotation;
        isSpinningRef.current = false;
        setActivitySelection(activities[winnerIndex]);
        const maxLen = Math.floor(activities.length / 2);
        setRecentActivities((prev) =>
          [activities[winnerIndex], ...prev].slice(0, maxLen),
        );
        drawWheel();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [
    activities,
    drawWheel,
    setActivitySelection,
    recentActivities,
    setRecentActivities,
  ]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div className="activity-wheel-section">
        <div className="activity-wheel-wrapper">
          <canvas
            ref={canvasRef}
            className="activity-wheel-canvas"
            width={350}
            height={350}
            onClick={spin}
            aria-label="Activity wheel – click to spin"
            role="button"
          />
        </div>

        <p className="activity-selection">{activitySelection ?? ""}</p>

        <Tooltip text="Configure activities" placement="bottom">
          <Button
            variant="ghost"
            size="md"
            color="dark"
            shape="circle"
            onClick={() => setShowSettings(true)}
            aria-label="Activity settings"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Button>
        </Tooltip>
      </div>

      {showSettings && (
        <ActivitySettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
});

ActivityWheel.displayName = "ActivityWheel";

export default ActivityWheel;
