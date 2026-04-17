import { Pressable, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SongCard } from '@/components/song-card';
import { EmptyState } from '@/components/empty-state';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSharedSongs } from '@/hooks/use-shared-songs';
import { useSongs } from '@/hooks/use-songs';
import { formatDate } from '@/utils/format';
import type { SongSummary } from '@/types/song';
import type { MemberSongSummary } from '@/lib/supabase/shared-songs';

function SharedSongCard({ song }: { song: MemberSongSummary }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/song/${song.id}/view`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        boxShadow: Shadows.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          backgroundColor: Colors.accentSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 22 }}>🎵</Text>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }} numberOfLines={1}>
          {song.ownerDisplayName ? `by ${song.ownerDisplayName}` : null}
          {song.ownerDisplayName && (song.songKey || song.bpm) ? ' · ' : ''}
          {[song.songKey, song.bpm ? `${song.bpm} BPM` : null].filter(Boolean).join(' · ') || formatDate(new Date(song.updatedAt).getTime())}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 7,
          paddingVertical: 3,
          backgroundColor: Colors.accentSubtle,
          borderRadius: 5,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.accent }}>
          {song.role}
        </Text>
      </View>
    </Pressable>
  );
}

type SectionItem =
  | { kind: 'owned'; song: SongSummary }
  | { kind: 'shared'; song: MemberSongSummary };

export default function SongsScreen() {
  const songs = useSongs();
  const auth = useAuth();
  const { songs: sharedSongs } = useSharedSongs(auth.user?.id);
  const router = useRouter();

  const sections: { title: string; data: SectionItem[] }[] = [];

  if (songs.length > 0 || sharedSongs.length === 0) {
    sections.push({
      title: 'My Songs',
      data: songs.map((song) => ({ kind: 'owned', song })),
    });
  }

  if (sharedSongs.length > 0) {
    sections.push({
      title: 'Shared with Me',
      data: sharedSongs.map((song) => ({ kind: 'shared', song })),
    });
  }

  if (songs.length === 0 && sharedSongs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <EmptyState
          icon="music.note"
          title="No songs yet"
          subtitle="Tap + to write your first song"
          actionLabel="New Song"
          onAction={() => router.push('/song/new')}
        />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => (item.kind === 'owned' ? item.song.id : `shared-${item.song.id}`)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 10 }}
      style={{ backgroundColor: Colors.background }}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) =>
        sections.length > 1 ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: Colors.textSecondary,
              marginBottom: 6,
              marginTop: section.title === 'My Songs' ? 0 : 12,
            }}
          >
            {section.title}
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        if (item.kind === 'owned') {
          return <SongCard song={item.song} />;
        }
        return <SharedSongCard song={item.song} />;
      }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}
