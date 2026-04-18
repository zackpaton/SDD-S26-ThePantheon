/**
 * Profile route: signed-in user profile, password change, and edit modal (see ProfilePageContent).
 */
import PageShell from "@/components/PageShell"
import ProfilePageContent from "@/components/profile/ProfilePageContent"

/** Thin server wrapper: shared shell around the client profile UI. */
export default function ProfilePage() {
  return (
    <PageShell>
      <ProfilePageContent />
    </PageShell>
  )
}
