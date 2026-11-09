import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { AVATARS, TARGET_LEVELS, ProfileFields } from '@/lib/profile-fields';
import { Colors } from '@/constants/theme';

export default function EditProfile() {
  const { user, updateProfile, requestEmailChange, refreshProfile } = useAuth();
  const [fields, setFields] = useState<ProfileFields>({
    display_name: user?.displayName || '',
    avatar_key: user?.avatarKey || 'learner',
    target_level: user?.targetLevel || 'TOPIK II Level 4',
    daily_goal: user?.dailyGoal || 3,
    bio: user?.bio || '',
    korean_background: user?.koreanBackground || '',
  });
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [message, setMessage] = useState('');
  const colors = Colors.light;
  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.card,
    fontSize: 16,
  };
  const update = (patch: Partial<ProfileFields>) =>
    setFields((previous) => ({ ...previous, ...patch }));
  if (!user)
    return (
      <SafeAreaView style={{ flex: 1, padding: 24 }}>
        <Text>Sign in to manage your profile.</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
          <Text>Sign in</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  const contributor = user.role === 'contributor' || user.role === 'admin';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ color: colors.accent }}>Close</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 26, fontWeight: '700' }}>Edit profile</Text>
        <Text>Choose your avatar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(AVATARS).map(([key, emoji]) => (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${key} avatar`}
              accessibilityState={{ selected: fields.avatar_key === key }}
              onPress={() => update({ avatar_key: key })}
              style={{
                padding: 12,
                borderWidth: 2,
                borderColor: fields.avatar_key === key ? colors.accent : colors.border,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          style={input}
          value={fields.display_name}
          onChangeText={(display_name) => update({ display_name })}
          maxLength={60}
        />
        <Text>Target TOPIK level</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TARGET_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              accessibilityRole="button"
              accessibilityState={{ selected: fields.target_level === level }}
              onPress={() => update({ target_level: level })}
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: fields.target_level === level ? colors.accentLight : colors.card,
              }}
            >
              <Text>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>Daily goal (1–20 activities)</Text>
        <TextInput
          accessibilityLabel="Daily goal"
          style={input}
          keyboardType="number-pad"
          value={String(fields.daily_goal || '')}
          onChangeText={(value) => update({ daily_goal: Number(value) })}
          maxLength={2}
        />
        {contributor && (
          <>
            <Text style={{ fontWeight: '700' }}>Public Contributors profile</Text>
            <Text>
              Your name, avatar, bio, and Korean background appear in the Contributors directory.
              Background details are self-reported.
            </Text>
            <Text>Bio</Text>
            <TextInput
              accessibilityLabel="Bio"
              style={[input, { minHeight: 90 }]}
              multiline
              maxLength={300}
              value={fields.bio}
              onChangeText={(bio) => update({ bio })}
            />
            <Text>Korean / TOPIK background</Text>
            <TextInput
              accessibilityLabel="Korean background"
              style={[input, { minHeight: 90 }]}
              multiline
              maxLength={300}
              value={fields.korean_background}
              onChangeText={(korean_background) => update({ korean_background })}
            />
          </>
        )}
        <Text accessibilityLiveRegion="polite">{message}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setMessage('');
            try {
              await updateProfile(fields);
              setMessage('Profile saved.');
            } catch (error: any) {
              setMessage(error.message);
            } finally {
              setBusy(false);
            }
          }}
          style={{ backgroundColor: colors.accent, padding: 16, borderRadius: 12 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
            {busy ? 'Saving…' : 'Save profile'}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '700', marginTop: 12 }}>Email address</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            void refreshProfile().catch((error) => Alert.alert('Refresh failed', error.message));
          }}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ color: colors.accent }}>Refresh email status</Text>
        </TouchableOpacity>
        <Text>Current email: {user.email}</Text>
        <TextInput
          accessibilityLabel="New email address"
          style={input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          placeholder="New email address"
        />
        <TouchableOpacity
          accessibilityRole="button"
          disabled={emailBusy || !email.trim()}
          onPress={async () => {
            setEmailBusy(true);
            try {
              const result = await requestEmailChange(email);
              setEmail('');
              Alert.alert(
                result === 'updated' ? 'Email updated' : 'Check your email',
                result === 'updated'
                  ? 'Your email address has been updated.'
                  : 'Follow the confirmation instructions sent by email. Your current address stays in use until the change is confirmed.',
              );
            } catch (error: any) {
              Alert.alert('Email change failed', error.message);
            } finally {
              setEmailBusy(false);
            }
          }}
          style={{ paddingVertical: 14 }}
        >
          <Text style={{ color: colors.accent }}>
            {emailBusy ? 'Requesting…' : 'Request email change'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
