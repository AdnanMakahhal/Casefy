export function canChangeTicketStatus(current, next) {
  if (current === "resolved") return false;
  if (current === next) return true;
  return (current === "pending" && next === "open") || (current === "open" && next === "resolved");
}
