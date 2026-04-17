import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SongSheetView } from '@/components/song-sheet-view';
import { useAuth } from '@/hooks/use-auth';
import { useEditLock } from '@/hooks/use-edit-lock';
import { useSongComments } from '@/hooks/use-song-comments';
import { getSupabaseClient } from '@/lib/supabase/client';
import { pushEditorChanges } from '@/lib/supabase/edit-locks';
import { fetchMemberSongGraph } from '@/lib/supabase/shared-songs';
import { parseChords } from '@/utils/chord-parser';
import { formatDate } from '@/utils/format';
import type { SharedSongData } from '@/lib/supabase/public-links';
import type { SongViewData } from '@/types/share';

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

interface EditLine {
  id: string;
  text: string;
  memo: string | null;
}

interface EditSection {
  id: string;
  label: string;
  lines: EditLine[];
}

function sharedSongToViewData(song: SharedSongData): SongViewData {
  return {
    title: song.title,
    author: song.ownerDisplayName,
    key: song.songKey,
    bpm: song.bpm,
    chordDisplayMode: song.chordDisplayMode,
    customChords: song.customChords,
    sections: song.sections.map((sec) => ({
      id: sec.id,
      label: sec.label,
      sectionOrder: sec.sectionOrder,
      audioKey: null,
      audioUri: null,
      sectionRecordingDuration: null,
      lines: sec.lines.map((line) => ({
        id: line.id,
        text: line.text,
        memo: line.memo,
        chordAnnotations: parseChords(line.chords),
        audioKey: null,
        audioUri: null,
        lineRecordingDuration: null,
      })),
    })),
  };
}

function songToEditSections(song: SharedSongData): EditSection[] {
  return song.sections.map((sec) => ({
    id: sec.id,
    label: sec.label,
    lines: sec.lines.map((line) => ({
      id: line.id,
      text: line.text,
      memo: line.memo,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Inline editor component
// ---------------------------------------------------------------------------

function InlineEditor({
  sections,
  onChange,
}: {
  sections: EditSection[];
  onChange: (updated: EditSection[]) => void;
}) {
  function updateSectionLabel(sectionIndex: number, label: string) {
    const updated = sections.map((sec, i) => (i === sectionIndex ? { ...sec, label } : sec));
    onChange(updated);
  }

  function updateLineText(sectionIndex: number, lineIndex: number, text: string) {
    const updated = sections.map((sec, si) =>
      si !== sectionIndex
        ? sec
        : {
            ...sec,
            lines: sec.lines.map((line, li) => (li !== lineIndex ? line : { ...line, text })),
          }
    );
    onChange(updated);
  }

  function updateLineMemo(sectionIndex: number, lineIndex: number, memo: string) {
    const updated = sections.map((sec, si) =>
      si !== sectionIndex
        ? sec
        : {
            ...sec,
            lines: sec.lines.map((line, li) =>
              li !== lineIndex ? line : { ...line, memo: memo || null }
            ),
          }
    );
    onChange(updated);
  }

  return (
    <View style={{ gap: 24 }}>
      {sections.map((section, si) => (
        <View key={section.id} style={{ gap: 10 }}>
          <TextInput
            value={section.label}
            onChangeText={(text) => updateSectionLabel(si, text)}
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: Colors.textPrimary,
              borderBottomWidth: 1,
              borderColor: Colors.accent,
              paddingVertical: 4,
            }}
            placeholder="Section name"
            placeholderTextColor={Colors.textTertiary}
          />

          <View style={{ gap: 8 }}>
            {section.lines.map((line, li) => (
              <View
                key={line.id}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.accent,
                  padding: 12,
                  gap: 6,
                }}
              >
                <TextInput
                  value={line.text}
                  onChangeText={(text) => updateLineText(si, li, text)}
                  multiline
                  style={{
                    fontSize: 17,
                    lineHeight: 26,
                    color: Colors.textPrimary,
                    fontFamily: Fonts.mono,
                  }}
                  placeholder="Lyric line..."
                  placeholderTextColor={Colors.textTertiary}
                />
                <TextInput
                  value={line.memo ?? ''}
                  onChangeText={(text) => updateLineMemo(si, li, text)}
                  style={{
                    fontSize: 13,
                    color: Colors.textSecondary,
                    borderTopWidth: 1,
                    borderColor: Colors.border,
                    paddingTop: 6,
                    fontFamily: Fonts.sans,
                  }}
                  placeholder="Note (optional)"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SongMemberViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [song, setSong] = useState<SharedSongData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editSections, setEditSections] = useState<EditSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Comments
  const [commentDraft, setCommentDraft] = useState('');
  const { comments, submitting, submit, remove, error: commentError } = useSongComments(auth.user?.id, id);

  // Lock
  const editLock = useEditLock(auth.user?.id, id);

  // Determine if current user is an editor (from member role)
  // We detect this by checking if they can attempt to acquire a lock (the RPC will reject non-editors)
  // For UI purposes we check if they already hold the lock or can try to acquire it.
  // We rely on attempting acquire + checking the error to know if they're an editor.
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFetchError('Cloud service unavailable.');
      setLoading(false);
      return;
    }

    fetchMemberSongGraph(supabase, id)
      .then((data) => {
        if (!data) setFetchError('Song not found or you do not have access.');
        else setSong(data);
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'Failed to load song.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Detect editor role by checking if the user is a member with role=editor
  useEffect(() => {
    if (!auth.user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase
      .from('song_members')
      .select('role')
      .eq('song_id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'editor') setIsEditor(true);
      });
  }, [auth.user, id]);

  async function handleRequestLock() {
    const granted = await editLock.acquire();
    if (granted) {
      if (song) setEditSections(songToEditSections(song));
      setIsEditing(true);
    } else {
      Alert.alert(
        'Lock unavailable',
        editLock.lock?.isActive
          ? `${editLock.lock.heldByDisplayName ?? 'Another editor'} is currently editing. Ask them to finish or wait for their session to expire.`
          : 'Could not acquire edit lock. Try again.'
      );
    }
  }

  async function handleSaveChanges() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSaving(true);
    setSaveError(null);
    try {
      await pushEditorChanges(supabase, id, editSections);
      await editLock.release();

      // Reload song data
      const updated = await fetchMemberSongGraph(supabase, id);
      if (updated) setSong(updated);
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleDiscardChanges() {
    Alert.alert('Discard changes', 'Your unsaved edits will be lost and the edit lock released.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await editLock.release();
          setIsEditing(false);
          setSaveError(null);
        },
      },
    ]);
  }

  async function handleSubmitComment() {
    if (!commentDraft.trim()) return;
    await submit(commentDraft);
    setCommentDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const lockBanner = (() => {
    if (!editLock.lock?.isActive) return null;
    if (editLock.isMine) return null; // handled by edit mode header
    return (
      <View
        style={{
          backgroundColor: Colors.accentSubtle,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text style={{ fontSize: 13, color: Colors.accent, fontWeight: '600' }}>
          {editLock.lock.heldByDisplayName ?? 'Someone'} is currently editing this song
        </Text>
      </View>
    );
  })();

  const myRole = isEditing ? 'Editor' : isEditor ? 'Editor' : 'Viewer';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
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
        {isEditing ? (
          <>
            <Pressable
              disabled={saving}
              onPress={() => { void handleDiscardChanges(); }}
              hitSlop={10}
              style={{ padding: 4, opacity: saving ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 16, color: Colors.destructive, fontWeight: '600' }}>
                Discard
              </Text>
            </Pressable>

            <Text
              style={{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}
              numberOfLines={1}
            >
              Editing
            </Text>

            <Pressable
              disabled={saving}
              onPress={() => { void handleSaveChanges(); }}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 6,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
              <IconSymbol name="chevron.left" size={22} color={Colors.accent} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }} numberOfLines={1}>
                {loading ? 'Loading...' : (song?.title ?? 'Song')}
              </Text>
              {song?.ownerDisplayName && (
                <Text style={{ fontSize: 12, color: Colors.textSecondary }} numberOfLines={1}>
                  by {song.ownerDisplayName}
                </Text>
              )}
            </View>

            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: Colors.accentSubtle,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.accent }}>
                {myRole}
              </Text>
            </View>

            {isEditor && !editLock.loading && !editLock.lock?.isActive && (
              <Pressable
                disabled={editLock.acquiring}
                onPress={() => { void handleRequestLock(); }}
                hitSlop={10}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  opacity: editLock.acquiring ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accentForeground }}>
                  {editLock.acquiring ? '...' : 'Edit'}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {lockBanner}

      {/* Body */}
      {loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Loading song...</Text>
        </View>
      )}

      {!loading && fetchError && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}>
            Could not open song
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' }}>
            {fetchError}
          </Text>
        </View>
      )}

      {!loading && song && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Song content — editable or read-only */}
            {isEditing ? (
              <>
                {saveError && (
                  <Text style={{ fontSize: 14, color: Colors.destructive }}>{saveError}</Text>
                )}
                <InlineEditor sections={editSections} onChange={setEditSections} />
                <Text style={{ fontSize: 12, lineHeight: 18, color: Colors.textTertiary, textAlign: 'center' }}>
                  Note: chord annotations are preserved but not shown in edit mode. Save to see the updated song.
                </Text>
              </>
            ) : (
              <SongSheetView data={sharedSongToViewData(song)} />
            )}

            {/* Comments — only shown in read mode */}
            {!isEditing && (
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
                  Comments {comments.length > 0 ? `(${comments.length})` : ''}
                </Text>

                {comments.length === 0 && !auth.user && (
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
                    Sign in to leave a comment.
                  </Text>
                )}

                {comments.length === 0 && auth.user && (
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
                    No comments yet. Be the first to leave a note.
                  </Text>
                )}

                <View style={{ gap: 10 }}>
                  {comments.map((comment) => (
                    <View
                      key={comment.id}
                      style={{
                        backgroundColor: Colors.surface,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: 12,
                        padding: 12,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
                          {comment.authorDisplayName ?? 'Anonymous'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 11, color: Colors.textTertiary }}>
                            {formatDate(new Date(comment.createdAt).getTime())}
                          </Text>
                          {auth.user?.id === comment.authorId && (
                            <Pressable onPress={() => { void remove(comment.id); }} hitSlop={8}>
                              <IconSymbol name="trash" size={14} color={Colors.textTertiary} />
                            </Pressable>
                          )}
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
                        {comment.body}
                      </Text>
                    </View>
                  ))}
                </View>

                {commentError && (
                  <Text style={{ fontSize: 14, color: Colors.destructive }}>{commentError}</Text>
                )}

                {auth.user && (
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                    <TextInput
                      value={commentDraft}
                      onChangeText={setCommentDraft}
                      placeholder="Leave a comment..."
                      placeholderTextColor={Colors.textTertiary}
                      multiline
                      style={{
                        flex: 1,
                        backgroundColor: Colors.surface,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 15,
                        color: Colors.textPrimary,
                        maxHeight: 120,
                        fontFamily: Fonts.sans,
                      }}
                    />
                    <Pressable
                      disabled={submitting || !commentDraft.trim()}
                      onPress={() => { void handleSubmitComment(); }}
                      style={{
                        backgroundColor: Colors.accent,
                        borderRadius: 12,
                        padding: 12,
                        opacity: submitting || !commentDraft.trim() ? 0.5 : 1,
                      }}
                    >
                      <IconSymbol name="arrow.up" size={18} color={Colors.accentForeground} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
