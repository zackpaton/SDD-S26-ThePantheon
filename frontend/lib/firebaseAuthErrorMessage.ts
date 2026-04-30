/**
 * Maps Firebase Auth error codes to short, actionable copy for login/signup.
 */
export function firebaseAuthErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err ?
      String((err as { code?: string }).code) :
      '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with that email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
