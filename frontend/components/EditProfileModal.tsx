'use client';

/**
 * Modal to edit the signed-in user’s profile fields and persist via PUT
 * /api/users/:userId.
 */
import {useState} from 'react';
import {API_ORIGIN} from '@/lib/apiBase';
import {getApiErrorMessage} from '@/lib/apiErrorMessage';
import {auth} from '@/lib/firebase';

/** User document fields used by this modal and returned from the API. */
export type UserProfile = {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  classYear?: string
  major?: string
  interests?: string
  role?: string
  fraternity?: string
}

interface Props {
  profile: UserProfile
  userId: string
  onClose: () => void
  onSave: (updatedProfile: UserProfile) => void
}

/**
 * Local form mirrors profile; on successful save passes the server JSON to
 * onSave before closing.
 */
export default function EditProfileModal({
  profile,
  userId,
  onClose,
  onSave,
}: Props) {
  const [formData, setFormData] = useState<UserProfile>({...profile});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /** Merges input/textarea changes into formData by field name. */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setSubmitError('');
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  /**
   * Authenticated PUT of formData; validates first/last name and surfaces API
   * errors.
   */
  const handleSubmit = async () => {
    setSubmitError('');
    const fn = formData.firstName?.trim() ?? '';
    const ln = formData.lastName?.trim() ?? '';
    if (!fn) {
      setSubmitError('First name is required.');
      return;
    }
    if (!ln) {
      setSubmitError('Last name is required.');
      return;
    }

    const payload = {...formData, firstName: fn, lastName: ln};
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSubmitError('You are not signed in.');
        return;
      }
      const token = await currentUser.getIdToken();

      const res = await fetch(`${API_ORIGIN}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(getApiErrorMessage(body, 'Could not update profile.'));
        return;
      }
      const updatedProfile = body as UserProfile;
      onSave(updatedProfile);
      onClose();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        'fixed inset-0 z-50 flex items-center justify-center ' +
        'bg-black/40 backdrop-blur-sm'
      }
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-bold">Edit Profile</h2>

        {submitError ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <div>
            <label className="font-semibold">First Name</label>
            <input
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              className="w-full rounded border px-2 py-1"
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="font-semibold">Last Name</label>
            <input
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              className="w-full rounded border px-2 py-1"
              autoComplete="family-name"
            />
          </div>

          <div>
            <label className="font-semibold">Class Year</label>
            <input
              name="classYear"
              value={formData.classYear || ''}
              onChange={handleChange}
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label className="font-semibold">Major</label>
            <input
              name="major"
              value={formData.major || ''}
              onChange={handleChange}
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label className="font-semibold">Interests</label>
            <textarea
              name="interests"
              value={formData.interests || ''}
              onChange={handleChange}
              className="w-full rounded border px-2 py-1"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className={
              'rounded bg-green-500 px-4 py-2 text-white ' +
              'hover:bg-green-600 disabled:opacity-60'
            }
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
