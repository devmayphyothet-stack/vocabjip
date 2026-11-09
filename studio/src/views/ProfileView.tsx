import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import {
  AVATARS,
  TARGET_LEVELS,
  validateProfile,
  ProfileFields,
} from '../../../src/lib/profile-fields';

export function ProfileView() {
  const { user, refreshProfile, finishDeletedAccount } = useAuth();
  const [fields, setFields] = useState<ProfileFields>({
    display_name: user?.display_name || '',
    avatar_key: user?.avatar_key || 'learner',
    bio: user?.bio || '',
    korean_background: user?.korean_background || '',
    target_level: user?.target_level || 'TOPIK II Level 4',
    daily_goal: user?.daily_goal || 3,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const update = (patch: Partial<ProfileFields>) =>
    setFields((previous) => ({ ...previous, ...patch }));
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Contributors profile</h1>
      <p>
        Your name, avatar, bio and Korean background appear in the public Contributors directory.
        Background details are self-reported. Account roles are managed by administrators.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage('');
          try {
            const value = validateProfile(fields);
            const { error } = await supabase.rpc('update_own_profile', { profile_fields: value });
            if (error) throw error;
            await refreshProfile();
            setMessage('Profile saved.');
          } catch (error: any) {
            setMessage(error.message || 'Could not save profile.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div role="group" aria-label="Avatar" className="flex flex-wrap gap-3">
          {Object.entries(AVATARS).map(([key, emoji]) => (
            <button
              type="button"
              key={key}
              aria-label={`${key} avatar`}
              aria-pressed={fields.avatar_key === key}
              onClick={() => update({ avatar_key: key })}
              className={`p-3 text-2xl border-2 rounded-xl ${fields.avatar_key === key ? 'border-blue-600' : 'border-slate-200'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <label className="block">
          Display name
          <input
            className="block w-full border rounded-xl p-3"
            value={fields.display_name}
            maxLength={60}
            required
            onChange={(event) => update({ display_name: event.target.value })}
          />
        </label>
        <label className="block">
          Bio
          <textarea
            className="block w-full border rounded-xl p-3"
            value={fields.bio}
            maxLength={300}
            onChange={(event) => update({ bio: event.target.value })}
          />
        </label>
        <label className="block">
          Korean / TOPIK background
          <textarea
            className="block w-full border rounded-xl p-3"
            value={fields.korean_background}
            maxLength={300}
            onChange={(event) => update({ korean_background: event.target.value })}
          />
        </label>
        <label className="block">
          Target TOPIK level
          <select
            className="block w-full border rounded-xl p-3"
            value={fields.target_level}
            onChange={(event) => update({ target_level: event.target.value })}
          >
            {TARGET_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="block">
          Daily goal
          <input
            className="block w-full border rounded-xl p-3"
            type="number"
            min={1}
            max={20}
            step={1}
            value={fields.daily_goal}
            onChange={(event) => update({ daily_goal: Number(event.target.value) })}
          />
        </label>
        <p role="status">{message}</p>
        <button disabled={busy} className="bg-blue-600 text-white p-3 rounded-xl">
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>
      <form
        className="space-y-3 border-t pt-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setEmailBusy(true);
          try {
            const { data, error } = await supabase.auth.updateUser({
              email: email.trim().toLowerCase(),
            });
            if (error) throw error;
            setMessage(
              data.user?.email === email.trim().toLowerCase()
                ? 'Email updated.'
                : 'Check your email to confirm the address change.',
            );
            setEmail('');
          } catch (error: any) {
            setMessage(error.message);
          } finally {
            setEmailBusy(false);
          }
        }}
      >
        <p>Current email: {user?.email}</p>
        <button
          type="button"
          onClick={() => {
            void refreshProfile().catch(() =>
              setMessage('Could not refresh profile. Please retry.'),
            );
          }}
        >
          Refresh email status
        </button>
        <label className="block">
          New email
          <input
            className="block w-full border rounded-xl p-3"
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button disabled={emailBusy} className="border p-3 rounded-xl">
          {emailBusy ? 'Requesting…' : 'Request email change'}
        </button>
      </form>
      <form
        className="border-t border-red-200 pt-6 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (
            !window.confirm(
              'Permanently delete your account and private data? This cannot be undone.',
            )
          )
            return;
          setDeleting(true);
          setMessage('');
          try {
            const { data, error } = await supabase.functions.invoke('delete-account', {
              body: { password: deletePassword, confirmation: deleteConfirmation },
            });
            if (error || data?.deleted !== true) {
              let detail =
                data?.error ||
                'Deletion did not finish. Your account has not been confirmed deleted.';
              if (error?.context instanceof Response) {
                try {
                  detail = (await error.context.json()).error || detail;
                } catch {
                  /* Keep the fallback. */
                }
              }
              throw new Error(detail);
            }
            setDeletePassword('');
            await finishDeletedAccount();
          } catch (error: any) {
            setMessage(error.message);
          } finally {
            setDeleting(false);
          }
        }}
      >
        <h2 className="font-bold text-red-700">Delete account</h2>
        <p>
          Deletes your account, private writing, bookmarks, and published essays. Curriculum and
          reviews for other learners remain with your name removed. Offline copies on other devices
          cannot be removed from here.
        </p>
        {user?.role === 'admin' ? (
          <p>Ask another administrator to change your role before deleting this account.</p>
        ) : (
          <>
            <label className="block">
              Current password
              <input
                className="block w-full border rounded-xl p-3"
                type="password"
                autoComplete="current-password"
                required
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </label>
            <label className="block">
              Type DELETE to confirm
              <input
                className="block w-full border rounded-xl p-3"
                required
                pattern="DELETE"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>
            <button
              disabled={deleting || deleteConfirmation !== 'DELETE' || !deletePassword}
              className="border border-red-600 text-red-700 p-3 rounded-xl"
            >
              {deleting ? 'Deleting…' : 'Delete account permanently'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
