export const roles = [
  "admin",
  "manager",
  "qa_engineer",
  "student",
  "employee",
  "developer",
];

export const plans = ["free", "plus", "pro", "enterprise"];

export const label = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const number = (value) => value?.toLocaleString("en-US") ?? "—";

export const date = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
