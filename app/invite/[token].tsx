import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getInvitePreview, redeemInvite, type InvitePreview } from '@/lib/supabase/invites';

export default function InviteRedemptionScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const auth = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedSongId, setRedeemedSongId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPreviewError('Cloud service unavailable.');
      setLoadingPreview(false);
      return;
    }

    getInvitePreview(supabase, token)
      .then((result) => {
        setPreview(result);
        if (!result) setPreviewError('This invite link does not exist.');
      })
      .catch((err) => setPreviewError(err instanceof Error ? err.message : 'Failed to load invite.'))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  async function handleRedeem() {
    if (!auth.user) {
      router.push('/auth');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setRedeeming(true);
    setRedeemError(null);
    try {
      const songId = await redeemInvite(supabase, token);
      if (!songId) {
        setRedeemError('This invite link is no longer valid.');
        return;
      }
      setRedeemedSongId(songId);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Failed to join the song.');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 24 }}>

        {loadingPreview && (
          <Text style={{ fontSize: 16, color: Colors.textSecondary, textAlign: 'center' }}>
            Loading invite...
          </Text>
        )}

        {!loadingPreview && previewError && (
          <View style={{ gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' }}>
              Invite unavailable
            </Text>
            <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              {previewError}
            </Text>
          </View>
        )}

        {!loadingPreview && preview && !preview.isValid && (
          <View style={{ gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' }}>
              Invite expired
            </Text>
            <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              This invite link has already been used or was revoked. Ask the song owner for a new link.
            </Text>
          </View>
        )}

        {!loadingPreview && preview?.isValid && !redeemedSongId && (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Song Invite
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.textPrimary }}>
                {preview.songTitle}
              </Text>
              {preview.inviterDisplayName && (
                <Text style={{ fontSize: 16, color: Colors.textSecondary }}>
                  Invited by {preview.inviterDisplayName}
                </Text>
              )}
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: Colors.accentSubtle,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>
                  {preview.role === 'editor' ? 'Editor access' : 'Viewer access'}
                </Text>
              </View>
            </View>

            {redeemError && (
              <Text style={{ fontSize: 14, color: Colors.destructive }}>{redeemError}</Text>
            )}

            {!auth.user ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
                  Sign in or create a free account to accept this invitation.
                </Text>
                <Pressable
                  onPress={() => router.push('/auth')}
                  style={{
                    backgroundColor: Colors.accent,
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentForeground }}>
                    Sign In to Accept
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={redeeming}
                onPress={() => { void handleRedeem(); }}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: redeeming ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentForeground }}>
                  {redeeming ? 'Joining...' : 'Accept Invitation'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {redeemedSongId && (
          <View style={{ gap: 20, alignItems: 'center' }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' }}>
                You&apos;re in!
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: 'center' }}>
                You can now view &quot;{preview?.songTitle}&quot; and leave comments.
              </Text>
            </View>

            <Pressable
              onPress={() => router.replace(`/song/${redeemedSongId}/view`)}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 32,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentForeground }}>
                Open Song
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
