import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Modal, TouchableWithoutFeedback, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSong } from '@/hooks/use-song';
import { subscribe } from '@/db/events';
import {
  getSnapshotsForSong, createSnapshot,
  deleteSnapshot, restoreSnapshot,
} from '@/db/snapshots';
import { SnapshotListRow } from '@/components/snapshot-row';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';
import { uuid } from '@/utils/uuid';
import type { SnapshotRow } from '@/types/song';

export default function SnapshotsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const song = useSong(id);

  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // "Save version" modal state
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');

  async function loadSnapshots() {
    const rows = await getSnapshotsForSong(id);
    setSnapshots(rows);
  }

  useEffect(() => {
    loadSnapshots();
    const unsub = subscribe(`snapshots:${id}`, loadSnapshots);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveVersion() {
    if (!song) return;
    setSaving(true);
    try {
      await createSnapshot(uuid(), id, labelDraft.trim() || null, song);
      setLabelDraft('');
      setLabelModalVisible(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(snapshot: SnapshotRow) {
    setRestoring(true);
    try {
      await restoreSnapshot(snapshot, id);
      router.dismiss();
    } catch {
      Alert.alert('Restore failed', 'Could not restore this version.');
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete(snapshot: SnapshotRow) {
    await deleteSnapshot(snapshot.id, id);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {restoring && (
        <View
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(17,24,39,0.4)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ color: Colors.surface, marginTop: 12, fontWeight: '600' }}>
            Restoring…
          </Text>
        </View>
      )}

      {/* Save version button */}
      <Pressable
        onPress={() => setLabelModalVisible(true)}
        style={({ pressed }) => ({
          margin: 16,
          marginBottom: 8,
          backgroundColor: Colors.accent,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 22, color: Colors.accentForeground }}>+</Text>
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 16 }}>
          Save Current Version
        </Text>
      </Pressable>

      <FlatList
        data={snapshots}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, flexGrow: 1 }}
        renderItem={({ item }) => (
          <SnapshotListRow
            snapshot={item}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="clock.arrow.circlepath"
            title="No saved versions"
            subtitle="Tap 'Save Current Version' to create a restore point"
          />
        }
      />

      {/* Label input modal */}
      <Modal
        visible={labelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLabelModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLabelModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(17,24,39,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 20,
                  padding: 24,
                  width: 320,
                  gap: 16,
                  boxShadow: '0 4px 24px rgba(17,24,39,0.14)',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>
                  Save Version
                </Text>

                <TextInput
                  value={labelDraft}
                  onChangeText={setLabelDraft}
                  placeholder="Label (optional)"
                  placeholderTextColor={Colors.textTertiary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveVersion}
                  style={{
                    backgroundColor: Colors.surfaceSubtle,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 16,
                    color: Colors.textPrimary,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                />

                <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
                  A snapshot of your current lyrics will be saved.
                  You can restore it any time from this screen.
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={handleSaveVersion}
                    disabled={saving}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: Colors.accent,
                      borderRadius: 12,
                      padding: 13,
                      alignItems: 'center',
                      opacity: pressed || saving ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 15 }}>
                      {saving ? 'Saving…' : 'Save'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setLabelModalVisible(false); setLabelDraft(''); }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      padding: 13,
                      backgroundColor: Colors.accentSubtle,
                      alignItems: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: Colors.textSecondary, fontWeight: '600', fontSize: 15 }}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
