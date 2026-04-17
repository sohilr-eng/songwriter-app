import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCloudCapabilities } from '@/hooks/use-cloud-capabilities';
import { usePublicLink } from '@/hooks/use-public-link';
import { formatDate } from '@/utils/format';

const APP_SCHEME = 'songwriterapp2026';

function buildShareUrl(token: string): string {
  return `${APP_SCHEME}://shared/${token}`;
}

export default function SongShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const cloud = useCloudCapabilities();
  const { link, loading, creating, revoking, create, revoke, error } = usePublicLink(
    auth.user?.id,
    id
  );

  const shareUrl = link ? buildShareUrl(link.token) : null;

  async function handleCreate() {
    if (!cloud.canUseCloudFeatures) {
      Alert.alert(
        'Account required',
        'Sign in and complete your profile before sharing songs.'
      );
      return;
    }
    await create();
  }

  async function handleRevoke() {
    Alert.alert(
      'Revoke link',
      'Anyone with the current link will no longer be able to open this song. You can generate a new link at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => { void revoke(); },
        },
      ]
    );
  }

  function handleShare() {
    if (!shareUrl) return;
    void Share.share({ message: shareUrl, url: shareUrl });
  }

  const busy = creating || revoking;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
          Share Song
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Generate a link that lets anyone with the app open a read-only view of this song. No sign-in required on their end.
        </Text>
      </View>

      {!auth.user && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
            Sign in to share
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            Create an account or sign in to generate a shareable link for this song.
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
              Sign In or Create Account
            </Text>
          </Pressable>
        </View>
      )}

      {auth.user && !cloud.canUseCloudFeatures && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
            Complete your profile first
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            Add a display name in Settings before sharing songs.
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
              Open Settings
            </Text>
          </Pressable>
        </View>
      )}

      {auth.user && cloud.canUseCloudFeatures && (
        <>
          {loading && (
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
              Checking share status...
            </Text>
          )}

          {!loading && !link && (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                No active link
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
                Generate a link to share the current version of this song. The recipient can open it without an account.
              </Text>
              <Pressable
                disabled={busy}
                onPress={() => { void handleCreate(); }}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
                  {creating ? 'Generating...' : 'Generate Link'}
                </Text>
              </Pressable>
            </View>
          )}

          {!loading && link && shareUrl && (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                  Link active
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
                  Created {formatDate(new Date(link.createdAt).getTime())}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Text
                  style={{ fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace' }}
                  numberOfLines={2}
                  selectable
                >
                  {shareUrl}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={handleShare}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.accent,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
                    Share Link
                  </Text>
                </Pressable>

                <Pressable
                  disabled={busy}
                  onPress={() => { void handleRevoke(); }}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.destructive }}>
                    {revoking ? 'Revoking...' : 'Revoke Link'}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 12, lineHeight: 17, color: Colors.textTertiary }}>
                Revoking this link stops anyone from opening the song through it. You can generate a new one at any time.
              </Text>
            </View>
          )}

          {error && (
            <Text style={{ fontSize: 14, color: Colors.destructive }}>
              {error}
            </Text>
          )}
        </>
      )}

      {auth.user && cloud.canUseCloudFeatures && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              Invite collaborators
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              Invite specific people with a private token. They can view the song and leave comments after joining.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/song/${id}/members`)}
            style={{
              backgroundColor: Colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              Manage Collaborators
            </Text>
          </Pressable>
        </View>
      )}

      <View
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 16,
          padding: 16,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          How sharing works
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Public links let anyone with the app view the song without an account. Invite links grant named access — recipients sign in to accept. Brainstorm and version history are never shared.
        </Text>
      </View>
    </ScrollView>
  );
}
