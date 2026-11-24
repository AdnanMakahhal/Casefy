export const TEST_TYPE_GROUPS = [
  { label: "Testing scope", types: [
    ["functional", "Functional testing"],
    ["positive-negative", "Positive and negative testing"],
    ["edge", "Edge cases and boundary value testing"],
    ["ui", "UI testing"],
    ["accessibility", "Accessibility testing"],
    ["security", "Limited security testing"],
    ["regression", "Regression testing"],
  ] },
];

export const TEST_TYPES = TEST_TYPE_GROUPS.flatMap((group) =>
  group.types.map(([value, label]) => ({ value, label })),
);

export function normalizeTestTypes(types) {
  const aliases = { positive: "positive-negative", negative: "positive-negative", boundary: "edge" };
  return [...new Set(types.map((type) => aliases[type] || type))]
    .filter((value) => TEST_TYPES.some((type) => type.value === value));
}
