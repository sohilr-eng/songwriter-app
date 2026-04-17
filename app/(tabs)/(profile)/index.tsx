import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useDisplayName, useProfileAvatarUri } from '@/hooks/use-settings';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getAvatarUrl, saveProfile, uploadAvatar } from '@/lib/supabase/profile';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { ProfileFormField } from '@/components/profile/profile-form-field';
import { ProfileSection } from '@/components/profile/profile-section';
import { SocialLinkRow } from '@/components/profile/social-link-row';
import { TagInput } from '@/components/profile/tag-input';

interface ProfileDraft {
  displayName: string;
  username: string;
  bio: string;
  avatarPath: string | null;
  localAvatarUri: string | null;
  genreTags: string[];
  instruments: string[];
  websiteUrl: string;
  instagramHandle: string;
  spotifyUrl: string;
  soundcloudUrl: string;
}

function draftFromProfile(profile: NonNullable<ReturnType<typeof useAuth>['profile']>, localDisplayName: string): ProfileDraft {
  return {
    displayName: profile.displayName ?? localDisplayName,
    username: profile.username ?? '',
    bio: profile.bio ?? '',
    avatarPath: profile.avatarPath,
    localAvatarUri: null,
    genreTags: profile.genreTags,
    instruments: profile.instruments,
    websiteUrl: profile.websiteUrl ?? '',
    instagramHandle: profile.instagramHandle ?? '',
    spotifyUrl: profile.spotifyUrl ?? '',
    soundcloudUrl: profile.soundcloudUrl ?? '',
  };
}

const emptyDraft = (localDisplayName: string, localAvatarUri: string | null): ProfileDraft => ({
  displayName: localDisplayName,
  username: '',
  bio: '',
  avatarPath: null,
  localAvatarUri,
  genreTags: [],
  instruments: [],
  websiteUrl: '',
  instagramHandle: '',
  spotifyUrl: '',
  soundcloudUrl: '',
});

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { displayName: localDisplayName, setDisplayName } = useDisplayName();
  const { avatarUri: localAvatarUri, setAvatarUri: setLocalAvatarUri } = useProfileAvatarUri();

  const [draft, setDraft] = useState<ProfileDraft>(() => emptyDraft('', null));
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize or refresh the draft from persisted data, but don't clobber in-progress edits.
  useEffect(() => {
    if (hasLocalChanges) return;

    if (auth.profile) {
      setDraft(draftFromProfile(auth.profile, localDisplayName));
    } else {
      setDraft(emptyDraft(localDisplayName, localAvatarUri));
    }
  }, [auth.profile, hasLocalChanges, localAvatarUri, localDisplayName]);

  function patch(updates: Partial<ProfileDraft>) {
    setHasLocalChanges(true);
    setDraft((d) => ({ ...d, ...updates }));
  }

  async function handleAvatarPick(uri: string) {
    if (!auth.user) {
      patch({ localAvatarUri: uri });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      Alert.alert('Unavailable', 'Cloud storage is not configured on this device.');
      return;
    }

    setAvatarUploading(true);
    try {
      const path = await uploadAvatar(supabase, auth.user.id, uri);
      patch({ avatarPath: path });
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    await setDisplayName(draft.displayName);

    if (!auth.user) {
      await setLocalAvatarUri(draft.localAvatarUri);

      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
      setSavedFlash(true);
      savedFlashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
      setHasLocalChanges(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      Alert.alert('Unavailable', 'Cloud profile saving is not configured on this device.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile(supabase, {
        userId: auth.user.id,
        username: draft.username,
        displayName: draft.displayName,
        bio: draft.bio,
        avatarPath: draft.avatarPath,
        genreTags: draft.genreTags,
        instruments: draft.instruments,
        websiteUrl: draft.websiteUrl,
        instagramHandle: draft.instagramHandle,
        spotifyUrl: draft.spotifyUrl,
        soundcloudUrl: draft.soundcloudUrl,
      });
      setHasLocalChanges(false);
      await auth.refresh();

      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
      setSavedFlash(true);
      savedFlashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!auth.user?.email) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.auth.resetPasswordForEmail(auth.user.email);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setPasswordResetSent(true);
    setTimeout(() => setPasswordResetSent(false), 4000);
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const supabase = getSupabaseClient();
  const avatarUrl =
    !auth.user
      ? draft.localAvatarUri
      : supabase && draft.avatarPath
        ? getAvatarUrl(supabase, draft.avatarPath)
        : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Avatar */}
      <AvatarPicker
        avatarUrl={avatarUrl}
        displayName={draft.displayName || null}
        onPickUri={handleAvatarPick}
        loading={avatarUploading}
      />

      {/* Identity */}
      <ProfileSection title="Identity">
        <ProfileFormField
          label="Display Name"
          value={draft.displayName}
          onChangeText={(v) => patch({ displayName: v })}
          placeholder="Your name"
        />
        {auth.user && (
          <ProfileFormField
            label="Username"
            value={draft.username}
            onChangeText={(v) => patch({ username: v })}
            placeholder="unique-username"
            autoCapitalize="none"
          />
        )}
      </ProfileSection>

      {/* About */}
      {auth.user && (
        <ProfileSection title="About">
          <ProfileFormField
            label="Bio"
            value={draft.bio}
            onChangeText={(v) => patch({ bio: v })}
            placeholder="A short description of what you like to write."
            multiline
            numberOfLines={4}
          />
          <TagInput
            label="Genre / Style"
            tags={draft.genreTags}
            onChange={(tags) => patch({ genreTags: tags })}
            placeholder="e.g. Folk, Pop…"
            maxTags={8}
          />
          <TagInput
            label="Instruments"
            tags={draft.instruments}
            onChange={(tags) => patch({ instruments: tags })}
            placeholder="e.g. Guitar…"
            maxTags={8}
          />
        </ProfileSection>
      )}

      {/* Links */}
      {auth.user && (
        <ProfileSection title="Links">
          <SocialLinkRow
            icon="globe"
            label="Website"
            value={draft.websiteUrl}
            onChangeText={(v) => patch({ websiteUrl: v })}
            placeholder="https://yoursite.com"
          />
          <SocialLinkRow
            icon="camera"
            label="Instagram"
            value={draft.instagramHandle}
            onChangeText={(v) => patch({ instagramHandle: v })}
            placeholder="handle (no @)"
            keyboardType="default"
          />
          <SocialLinkRow
            icon="music.note"
            label="Spotify"
            value={draft.spotifyUrl}
            onChangeText={(v) => patch({ spotifyUrl: v })}
            placeholder="open.spotify.com/…"
          />
          <SocialLinkRow
            icon="waveform"
            label="SoundCloud"
            value={draft.soundcloudUrl}
            onChangeText={(v) => patch({ soundcloudUrl: v })}
            placeholder="soundcloud.com/…"
          />
        </ProfileSection>
      )}

      {/* Account */}
      {auth.user ? (
        <ProfileSection title="Account">
          <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
            {auth.user.email}
          </Text>

          <View>
            <Pressable
              onPress={() => { void handlePasswordReset(); }}
              style={{
                backgroundColor: Colors.accentSubtle,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.accentSubtleForeground }}>
                {passwordResetSent ? 'Reset email sent ✓' : 'Send Password Reset Email'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => { void handleSignOut(); }}
            style={{
              backgroundColor: Colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>
              Sign Out
            </Text>
          </Pressable>
        </ProfileSection>
      ) : auth.isConfigured ? (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}>
            Sync your profile
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' }}>
            Sign in to unlock username, bio, genre tags, instruments, social links, and cloud backup.
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
              Sign In or Create Account
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Save */}
      <Pressable
        disabled={saving || avatarUploading}
        onPress={() => { void handleSave(); }}
        style={{
          backgroundColor: Colors.accent,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          opacity: saving || avatarUploading ? 0.6 : 1,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {saving && <ActivityIndicator color={Colors.accentForeground} size="small" />}
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentForeground }}>
          {savedFlash ? 'Saved ✓' : saving ? 'Saving…' : 'Save Changes'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
