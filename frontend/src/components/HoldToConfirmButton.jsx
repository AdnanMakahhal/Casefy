import Span from "../ui/Span";
import Button from "../ui/Button";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  RiCheckLine as Check,
  RiDeleteBin6Line as Trash2
} from "react-icons/ri";

export default function HoldToConfirmButton({
  onConfirm,
  disabled,
  children = "Hold to delete",
  duration = 1600,
}) {
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timer = useRef(null);
  const completed = useRef(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);
  function cancel() {
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }
  function start() {
    if (disabled || completed.current || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      completed.current = true;
      setConfirmed(true);
      setHolding(false);
      onConfirm();
    }, duration);
  }
  return (
    <Button variant="danger" size="custom"
      type="button"
      disabled={disabled || confirmed}
      onPointerDown={(event) => {
        if (event.button === 0) {
          event.currentTarget.setPointerCapture(event.pointerId);
          start();
        }
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onBlur={cancel}
      onKeyDown={(event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          if (!event.repeat) start();
        }
      }}
      onKeyUp={(event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          cancel();
        }
      }}
      onClick={(event) => {
        event.preventDefault();
        if (event.detail === 0 && !completed.current && !disabled) {
          completed.current = true;
          setConfirmed(true);
          onConfirm();
        }
      }}
      aria-description="Press and hold for 1.6 seconds to confirm. Release to cancel."
      className="relative isolate min-h-11 touch-none select-none overflow-hidden px-4"
    >
      {!reduceMotion && (
        <Span
          aria-hidden="true"
          className={`absolute inset-0 -z-10 origin-left bg-red-900 [transform:scaleX(var(--hold-progress))] ${holding ? "[transition:transform_var(--hold-duration)_linear]" : "transition-none"}`}
          style={{
            "--hold-progress": holding || confirmed ? 1 : 0,
            "--hold-duration": `${duration}ms`,
          }}
        />
      )}
      {confirmed ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Trash2 size={16} aria-hidden="true" />
      )}
      {confirmed ? "Confirmed" : holding ? "Keep holding..." : children}
    </Button>
  );
}
