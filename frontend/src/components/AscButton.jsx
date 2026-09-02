import React from "react";
import { Link } from "react-router-dom";
import { useSound } from "@/context/SoundContext";

// ASCENDANCY button with tactical bracket hover, no pill shapes.
// Pass `to` for real in-app navigation — renders a crawlable <Link> (real
// href, works with middle-click/keyboard/screen readers) instead of a
// div/button with only an onClick handler. Omit `to` for non-navigation
// actions (submit, retry, download, share), which stay a plain <button>.
export default function AscButton({
  children,
  variant = "default", // default | red
  className = "",
  onClick,
  to,
  type = "button",
  disabled,
  ...rest
}) {
  const sound = useSound();
  const classes = `btn-asc brd-anim ${variant === "red" ? "btn-asc-red" : ""} ${
    disabled ? "cursor-not-allowed opacity-40" : ""
  } group text-sm ${className}`;

  const decorations = (
    <>
      <span className="brd-top" />
      <span className="brd-bottom" />
      <span className="brd-left" />
      <span className="brd-right" />
      <span className="inline-flex items-center gap-2">{children}</span>
    </>
  );

  const handleClick = (e) => {
    sound?.play("click");
    onClick && onClick(e);
  };
  const handleHover = () => sound?.play("hover");

  if (to && !disabled) {
    return (
      <Link to={to} onMouseEnter={handleHover} onClick={handleClick} className={classes} {...rest}>
        {decorations}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={handleHover}
      onClick={handleClick}
      className={classes}
      {...rest}
    >
      {decorations}
    </button>
  );
}
