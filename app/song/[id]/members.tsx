import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useEditLock } from '@/hooks/use-edit-lock';
import { useSongInvites } from '@/hooks/use-song-invites';
import { useSongMembers } from '@/hooks/use-song-members';
import { formatDate } from '@/utils/format';

const APP_SCHEME = 'songwriterapp2026';

function buildInviteUrl(token: string): string {
  return `${APP_SCHEME}://invite/${token}`;
}

export default function SongMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuth();
  const { members, removing, remove } = useSongMembers(id);
  const { invites, creating, create, revoke, error: inviteError } = useSongInvites(auth.user?.id, id);
  const editLock = useEditLock(auth.user?.id, id);

  async function handleCreateInvite() {
    const invite = await create('viewer');
    if (!invite) return;

    const url = buildInviteUrl(invite.token);
    void Share.share({
      message: `You've been invited to view a song. Open this link: ${url}`,
      url,
    });
  }

  function handleShareInvite(token: string) {
    const url = buildInviteUrl(token);
    void Share.share({
      message: `You've been invited to view a song. Open this link: ${url}`,
      url,
    });
  }

  function handleRevoke(inviteId: string) {
    Alert.alert('Revoke invite link', 'Anyone who has not yet accepted this link will no longer be able to join.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => { void revoke(inviteId); } },
    ]);
  }

  function handleRemoveMember(memberId: string, displayName: string | null) {
    Alert.alert(
      'Remove member',
      `Remove ${displayName ?? 'this person'} from the song? They will lose access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { void remove(memberId); } },
      ]
    );
  }

  const pendingInvites = invites.filter((inv) => !inv.redeemedAt);
  const redeemedInvites = invites.filter((inv) => !!inv.redeemedAt);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
          Collaborators
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Invite people to view this song. They will see a read-only version and can leave comments.
        </Text>
      </View>

      {/* Current members */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          Members ({members.length})
        </Text>

        {members.length === 0 ? (
          <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
            No one has joined yet. Send an invite link below.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {members.map((member) => (
              <View
                key={member.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>
                    {member.displayName ?? 'Unknown user'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                    {member.role} · joined {formatDate(new Date(member.createdAt).getTime())}
                  </Text>
                </View>
                <Pressable
                  disabled={removing === member.id}
                  onPress={() => handleRemoveMember(member.id, member.displayName)}
                  hitSlop={10}
                  style={{ opacity: removing === member.id ? 0.5 : 1 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.destructive }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit lock status */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          Edit Lock
        </Text>

        {editLock.lock?.isActive ? (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              padding: 12,
              gap: 10,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                {editLock.lock.heldByDisplayName ?? 'An editor'} is editing
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                Lock expires {formatDate(new Date(editLock.lock.expiresAt).getTime())}
              </Text>
            </View>
            <Pressable
              disabled={editLock.revoking}
              onPress={() => {
                Alert.alert(
                  'Revoke edit lock',
                  'This will immediately remove the editor\'s write access. Any unsaved changes on their end will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Revoke', style: 'destructive', onPress: () => { void editLock.revoke(); } },
                  ]
                );
              }}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: 'center',
                opacity: editLock.revoking ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.destructive }}>
                {editLock.revoking ? 'Revoking...' : 'Revoke Lock'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
            No one is currently editing. Editors can request a lock from the song view.
          </Text>
        )}

        {editLock.error && (
          <Text style={{ fontSize: 14, color: Colors.destructive }}>{editLock.error}</Text>
        )}
      </View>

      {/* Invite links */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          Invite Links
        </Text>

        <Pressable
          disabled={creating}
          onPress={() => { void handleCreateInvite(); }}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: creating ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
            {creating ? 'Creating...' : 'Generate Viewer Invite Link'}
          </Text>
        </Pressable>

        {pendingInvites.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
              Pending (not yet redeemed)
            </Text>
            {pendingInvites.map((invite) => (
              <View
                key={invite.id}
                style={{
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 12,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  {invite.role} · created {formatDate(new Date(invite.createdAt).getTime())}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleShareInvite(invite.token)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.accentSubtle,
                      borderRadius: 10,
                      paddingVertical: 9,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>
                      Share Again
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRevoke(invite.id)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.surface,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: 10,
                      paddingVertical: 9,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.destructive }}>
                      Revoke
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {redeemedInvites.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
              Already redeemed
            </Text>
            {redeemedInvites.map((invite) => (
              <View
                key={invite.id}
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
                  {invite.role} · redeemed {invite.redeemedAt ? formatDate(new Date(invite.redeemedAt).getTime()) : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {inviteError && (
        <Text style={{ fontSize: 14, color: Colors.destructive }}>{inviteError}</Text>
      )}

      <View
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 14,
          padding: 14,
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          About viewer access
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: Colors.textSecondary }}>
          Viewers see the current live version of this song and can leave comments. Brainstorm notes and version history are never shared. Viewers cannot edit the song.
        </Text>
      </View>
    </ScrollView>
  );
}
