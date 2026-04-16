/**
 * Login route: mounts the Firebase email/password LoginForm.
 */
import  LoginForm  from "@/components/forms/LoginForm";

/** Thin page that only renders the login form component. */
export default function LoginPage() {
  return (
     <LoginForm />
  )
}