import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseEnabled); // only true while initial check is in flight

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return;
    }

    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Send a magic-link email to the given address.
   * @param {string} email
   */
  const signInWithEmail = async (email) => {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  /**
   * Start Google OAuth flow.
   */
  const signInWithGoogle = async () => {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  /**
   * Sign the current user out.
   */
  const signOut = async () => {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
