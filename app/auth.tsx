import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCloudCapabilities } from '@/hooks/use-cloud-capabilities';
import { useDisplayName } from '@/hooks/use-settings';
import {
  signInWithEmail,
  signInWithOAuthProvider,
  signUpWithEmail,
} from '@/lib/supabase/auth';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthScreen() {
  const router = useRouter();
  const auth = useAuth();
  const cloud = useCloudCapabilities();
  const { displayName } = useDisplayName();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.user) {
      router.back();
    }
  }, [auth.user, router]);

  useEffect(() => {
    if (mode === 'sign-up' && !signupDisplayName.trim() && displayName.trim()) {
      setSignupDisplayName(displayName.trim());
    }
  }, [displayName, mode, signupDisplayName]);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter both an email and password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email.trim(), password);
      } else {
        const session = await signUpWithEmail(email.trim(), password, signupDisplayName);
        if (!session) {
          Alert.alert(
            'Check your email',
            'Finish email verification from the link we sent, then return to the app.'
          );
        }
      }
    } catch (error) {
      Alert.alert(
        mode === 'sign-in' ? 'Sign in failed' : 'Sign up failed',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setSubmitting(true);
    try {
      await signInWithOAuthProvider(provider);
    } catch (error) {
      Alert.alert(
        `Sign in with ${provider === 'google' ? 'Google' : 'Apple'} failed`,
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
          Account
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Sign in to unlock backup, sharing, and collaboration. Local drafting still works without an account.
        </Text>
      </View>

      {!auth.isConfigured && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
            {cloud.accountTitle}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            Add your Supabase URL and publishable key to `.env`, then restart Expo to enable account features.
          </Text>
        </View>
      )}

      {auth.isConfigured && (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setMode('sign-in')}
              style={{
                flex: 1,
                backgroundColor: mode === 'sign-in' ? Colors.accent : Colors.surface,
                borderWidth: 1,
                borderColor: mode === 'sign-in' ? Colors.accent : Colors.border,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: mode === 'sign-in' ? Colors.accentForeground : Colors.textPrimary,
                }}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('sign-up')}
              style={{
                flex: 1,
                backgroundColor: mode === 'sign-up' ? Colors.accent : Colors.surface,
                borderWidth: 1,
                borderColor: mode === 'sign-up' ? Colors.accent : Colors.border,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: mode === 'sign-up' ? Colors.accentForeground : Colors.textPrimary,
                }}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ gap: 6 }}>
              {mode === 'sign-up' && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
                    Display Name
                  </Text>
                  <TextInput
                    value={signupDisplayName}
                    onChangeText={setSignupDisplayName}
                    placeholder="How your profile should appear"
                    placeholderTextColor={Colors.textTertiary}
                    style={{
                      backgroundColor: Colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 16,
                      color: Colors.textPrimary,
                    }}
                  />
                </View>
              )}

              <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: Colors.textPrimary,
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: Colors.textPrimary,
                }}
              />
            </View>
            </View>

            <Pressable
              disabled={submitting}
              onPress={() => {
                void handleEmailAuth();
              }}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
                {submitting
                  ? 'Working...'
                  : mode === 'sign-in'
                    ? 'Sign In with Email'
                    : 'Create Account with Email'}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
              Or continue with
            </Text>

            <Pressable
              disabled={submitting}
              onPress={() => {
                void handleOAuth('google');
              }}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                Continue with Google
              </Text>
            </Pressable>

            <Pressable
              disabled={submitting}
              onPress={() => {
                void handleOAuth('apple');
              }}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                Continue with Apple
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}
