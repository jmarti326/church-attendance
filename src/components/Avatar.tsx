"use client";

interface AvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

export function Avatar({ firstName, lastName, photoUrl, size = "md" }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const cls = sizeClasses[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ backgroundColor: "var(--theme-primary-light)", color: "var(--theme-primary)" }}
    >
      {initials}
    </div>
  );
}
