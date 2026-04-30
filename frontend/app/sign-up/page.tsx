/**
 * Sign-up route: mounts the registration form that creates Firebase + backend
 * user rows.
 */
import SignUpForm from '@/components/forms/SignUpForm';

/** Thin page that only renders the sign-up form component. */
export default function SignUpPage() {
  return (
    <SignUpForm />
  );
}
