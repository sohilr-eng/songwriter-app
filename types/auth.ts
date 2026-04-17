import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
  genreTags: string[];
  instruments: string[];
  websiteUrl: string | null;
  instagramHandle: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
}

export interface AuthState {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
}
