import React from "react";
import { useSound } from "@/context/SoundContext";

// ASCENDANCY button with tactical bracket hover, no pill shapes.
export default function AscButton({
  children,
  variant = "default", // default | red
  className = "",
  onClick,
  type = "button",
  disabled,
  ...rest
}) {
  const sound = useSound();
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => sound?.play("hover")}
      onClick={(e) => {
        sound?.play("click");
        onClick && onClick(e);
      }}
      className={`btn-asc brd-anim ${variant === "red" ? "btn-asc-red" : ""} ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      } group text-sm ${className}`}
      {...rest}
    >
      <span className="brd-top" />
      <span className="brd-bottom" />
      <span className="brd-left" />
      <span className="brd-right" />
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
