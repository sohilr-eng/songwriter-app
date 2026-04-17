import { useState } from 'react';
import {
  View, Text, FlatList, Pressable, SafeAreaView,
  Modal, TouchableWithoutFeedback, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAlbum } from '@/hooks/use-album';
import { useSongs } from '@/hooks/use-songs';
import { CoverImage } from '@/components/cover-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/theme';
import { repositories } from '@/repositories';
import { pickCover } from '@/utils/pick-cover';
import type { SongSummary } from '@/types/song';

export default function AlbumDetailScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const router = useRouter();
  const detail = useAlbum(albumId);
  const allSongs = useSongs();

  const [addModalVisible, setAddModalVisible] = useState(false);

  async function handleChangeArtwork() {
    const uri = await pickCover(albumId);
    if (uri) await repositories.albums.update(albumId, { artwork: uri });
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Album',
      `Delete "${detail?.album.title}"? The songs inside won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await repositories.albums.delete(albumId);
            router.back();
          },
        },
      ]
    );
  }

  async function handleRemoveSong(song: SongSummary) {
    Alert.alert(
      'Remove from Album',
      `Remove "${song.title}" from this album?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void repositories.albums.removeSong(song.id, albumId);
          },
        },
      ]
    );
  }

  async function handleAddSong(song: SongSummary) {
    const current = await repositories.albums.listSongs(albumId);
    const nextOrder = current.length;
    await repositories.albums.addSong(song.id, albumId, nextOrder);
    setAddModalVisible(false);
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  const { album, songs } = detail;
  const trackedIds = new Set(songs.map(s => s.id));
  const unaddedSongs = allSongs.filter(s => !trackedIds.has(s.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="chevron.left" size={22} color={Colors.accent} />
        </Pressable>

        {/* Tappable album artwork */}
        <Pressable onPress={handleChangeArtwork}>
          {album.artwork ? (
            <Image
              source={{ uri: album.artwork }}
              style={{ width: 40, height: 40, borderRadius: 8 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 40, height: 40, borderRadius: 8,
                backgroundColor: Colors.surfaceSubtle,
                borderWidth: 1, borderColor: Colors.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconSymbol name="rectangle.stack.fill" size={18} color={Colors.textTertiary} />
            </View>
          )}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            {songs.length === 1 ? '1 song' : `${songs.length} songs`}
          </Text>
        </View>

        <Pressable onPress={handleDelete} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="trash" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* ── Tracklist ──────────────────────────────────────────────────── */}
      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 8, flexGrow: 1 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/song/${item.id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: Colors.surface,
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 14,
              boxShadow: Shadows.card,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ width: 22, fontSize: 14, color: Colors.textTertiary, fontWeight: '600', textAlign: 'center' }}>
              {index + 1}
            </Text>
            <CoverImage uri={item.coverUri} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }} numberOfLines={1}>
                {item.title}
              </Text>
              {(item.key || item.bpm) && (
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  {[item.key, item.bpm ? `${item.bpm} BPM` : null].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => handleRemoveSong(item)}
              hitSlop={12}
              style={{ padding: 6 }}
            >
              <IconSymbol name="minus.circle" size={20} color={Colors.textTertiary} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60 }}>
            <IconSymbol name="music.note" size={40} color={Colors.textTertiary} />
            <Text style={{ fontSize: 15, color: Colors.textSecondary, fontWeight: '600' }}>No songs yet</Text>
            <Text style={{ fontSize: 13, color: Colors.textTertiary }}>Tap the button below to add songs</Text>
          </View>
        }
      />

      {/* ── Floating add button ────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 16,
          paddingBottom: 28,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <Pressable
          onPress={() => setAddModalVisible(true)}
          disabled={unaddedSongs.length === 0}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: Colors.accent,
            borderRadius: 14,
            padding: 14,
            opacity: pressed || unaddedSongs.length === 0 ? 0.5 : 1,
          })}
        >
          <IconSymbol name="plus" size={18} color={Colors.accentForeground} />
          <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 15 }}>
            Add Songs
          </Text>
        </Pressable>
      </View>

      {/* ── Add songs modal ────────────────────────────────────────────── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAddModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.35)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  maxHeight: '70%',
                  paddingBottom: 34,
                }}
              >
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
                </View>

                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 20, paddingBottom: 12 }}>
                  Add to Album
                </Text>

                <FlatList
                  data={unaddedSongs}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleAddSong(item)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        backgroundColor: Colors.surfaceSubtle,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <CoverImage uri={item.coverUri} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {(item.key || item.bpm) && (
                          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                            {[item.key, item.bpm ? `${item.bpm} BPM` : null].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                      </View>
                      <IconSymbol name="plus.circle" size={22} color={Colors.accent} />
                    </Pressable>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
