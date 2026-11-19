import SigninForm from "../features/authentication/SigninForm";
import AuthLayout from "../features/authentication/AuthLayout";

export default function Signin() {
  return (
    <AuthLayout>
      <SigninForm />
    </AuthLayout>
  );
}