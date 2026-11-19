export function validateCredentials({ name, email, password }, signup = false) {
  if (signup && (typeof name !== "string" || !name.trim() || name.trim().length > 100))
    return { field: "fullName", message: "Enter your full name (up to 100 characters)." };
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { field: "email", message: "Enter a valid email address." };
  if (typeof password !== "string" || !password.trim())
    return { field: "password", message: "Enter your password." };
  if (signup && password.length < 8)
    return { field: "password", message: "Password must be at least 8 characters." };
  if (new TextEncoder().encode(password).length > 72)
    return { field: "password", message: "Password must be no more than 72 bytes. Use a shorter password." };
  return null;
}
