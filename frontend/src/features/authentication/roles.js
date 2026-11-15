export const signupRoles = [
  { value: "qa_engineer", label: "QA Engineer", description: "Plan, generate, and run tests for web applications." },
  { value: "developer", label: "Developer", description: "Build and test web applications with confidence." },
  { value: "employee", label: "Employee", description: "Support your team with reliable application testing." },
  { value: "student", label: "Student", description: "Learn testing and build practical QA skills." },
];

export const roleLabels = {
  ...Object.fromEntries(signupRoles.map(({ value, label }) => [value, label])),
  admin: "Admin",
  manager: "Manager",
};

export const rolePreferenceKey = "casefy.onboarding-role";
export const workspaceNameKey = "casefy.workspace-name";

export function readWorkspaceName() {
  try {
    return localStorage.getItem(workspaceNameKey)?.trim() || "";
  } catch {
    return "";
  }
}

export function readRolePreference() {
  try {
    const role = localStorage.getItem(rolePreferenceKey);
    // A local onboarding preference never grants admin access.
    return signupRoles.some(({ value }) => value === role) ? role : null;
  } catch {
    return null;
  }
}
