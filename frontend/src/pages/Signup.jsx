import SignupForm from "../features/authentication/SignupForm";
import AuthLayout from "../features/authentication/AuthLayout";

export default function Signup() {
  return (
    <AuthLayout signup>
      <SignupForm />
    </AuthLayout>
  );
}