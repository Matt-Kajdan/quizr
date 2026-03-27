import { useEffect, useState } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const avatarGradients = [
  "from-rose-300 to-pink-400 dark:from-rose-500/80 dark:to-pink-600/80",
  "from-sky-300 to-blue-400 dark:from-sky-500/80 dark:to-blue-600/80",
  "from-emerald-300 to-green-400 dark:from-emerald-500/80 dark:to-green-600/80",
  "from-orange-300 to-amber-400 dark:from-orange-500/80 dark:to-amber-600/80",
];

function getGradient(userId) {
  const value = String(userId || "");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % avatarGradients.length;
  }

  return avatarGradients[hash];
}

function getBorderRadius(shape) {
  if (shape === "circle") return "9999px";
  if (shape === "square") return "0px";
  return "30%";
}

export function UserAvatar({
  userId,
  name,
  src,
  size,
  shape = "rounded",
  border = false,
  className,
  imageClassName,
  textClassName,
  borderClassName,
  maxSize = 384,
  alt,
  style,
}) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  const initial = (name || "?").charAt(0).toUpperCase();
  const shouldShowImage = Boolean(src) && !hasImageError;
  const sizeStyle = size
    ? { width: `${size}px`, height: `${size}px` }
    : { maxWidth: `${maxSize}px`, aspectRatio: "1 / 1" };
  const shapeStyle = { borderRadius: getBorderRadius(shape) };

  return (
    <div
      className={joinClasses(
        "relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-br text-white",
        !size ? "w-full max-w-96" : "",
        border || borderClassName ? joinClasses("border", borderClassName) : "",
        className,
        getGradient(userId)
      )}
      style={{ ...sizeStyle, ...shapeStyle, ...style }}
    >
      {!shouldShowImage && (
        <span className={joinClasses("font-semibold", textClassName)}>
          {initial}
        </span>
      )}
      {shouldShowImage && (
        <img
          src={src}
          alt={alt ?? name ?? "User avatar"}
          className={joinClasses("absolute inset-0 h-full w-full object-cover", imageClassName)}
          onError={() => setHasImageError(true)}
        />
      )}
    </div>
  );
}
