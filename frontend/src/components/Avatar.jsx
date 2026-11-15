export default function Avatar({ user, className = "size-10" }) {
  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "C";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf3ef] font-bold text-[#294137] ${className}`}
    >
      {user?.avatarImage ? (
        <img src={user.avatarImage} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
