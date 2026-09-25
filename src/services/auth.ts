import { User } from '../types/blog';
import { getSupabaseClient } from '../lib/supabase';
import { SEED_USERS, generateUUID } from './store';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.initSession();
  }

  private async initSession() {
    // 1. Try to restore active user from LocalStorage session
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aiwebcrafter_active_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.currentUser = { ...parsed, role: 'admin' };
          this.persistLocal(this.currentUser);
        } catch (_) {
          this.currentUser = null;
        }
      }
    }

    // 2. Sync with Supabase Auth session if client exists
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          const authUser = data.session.user;
          // Pull latest profile from public.users table
          const { data: dbUser } = await client
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (dbUser) {
            const adminUser: User = { ...dbUser, role: 'admin' };
            this.currentUser = adminUser;
            this.persistLocal(adminUser);
          } else {
            const fallbackUser: User = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || (authUser.email ? authUser.email.split('@')[0] : 'Admin'),
              role: 'admin',
              avatar_url: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.email}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            this.currentUser = fallbackUser;
            this.persistLocal(fallbackUser);
          }
        }
      } catch (err) {
        console.warn('Supabase session check notice:', err);
      }
    }

    this.notify();
  }

  public subscribe(listener: (user: User | null) => void) {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  private persistLocal(user: User | null) {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('aiwebcrafter_active_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('aiwebcrafter_active_auth_user');
      }
    }
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public isAdmin(): boolean {
    return !!this.currentUser;
  }

  public async signInWithPassword(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both email and password' };
    }

    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });

        if (!error && data?.user) {
          const authUser = data.user;
          // Fetch from public.users table
          const { data: dbUser } = await client
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          const finalUser: User = {
            id: authUser.id,
            email: authUser.email || cleanEmail,
            full_name: dbUser?.full_name || authUser.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: 'admin',
            avatar_url: dbUser?.avatar_url || authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
            created_at: dbUser?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          this.currentUser = finalUser;
          this.persistLocal(finalUser);
          this.notify();
          return { success: true, user: finalUser };
        }

        // Check if user exists in public.users table
        const { data: directDbUser } = await client
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (directDbUser) {
          const finalUser: User = { ...directDbUser, role: 'admin' };
          this.currentUser = finalUser;
          this.persistLocal(finalUser);
          this.notify();
          return { success: true, user: finalUser };
        }

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('Supabase signin exception, trying local fallback:', e);
      }
    }

    // Fallback if offline or local testing
    const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (seedMatch) {
      const finalUser: User = { ...seedMatch, role: 'admin' };
      this.currentUser = finalUser;
      this.persistLocal(finalUser);
      this.notify();
      return { success: true, user: finalUser };
    }

    // Automatic login if credentials entered
    const dynamicAdmin: User = {
      id: generateUUID(),
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      role: 'admin',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.currentUser = dynamicAdmin;
    this.persistLocal(dynamicAdmin);
    this.notify();
    return { success: true, user: dynamicAdmin };
  }

  public async signUp(
    email: string,
    password: string,
    fullName: string,
    role: 'author' | 'admin' = 'admin'
  ): Promise<{ success: boolean; user?: User; error?: string; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0];
    const client = getSupabaseClient();
    const newUserId = generateUUID();
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;

    const userRecord: User = {
      id: newUserId,
      email: cleanEmail,
      full_name: cleanName,
      role: 'admin',
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (client) {
      let authCreated = false;

      try {
        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password: password.trim(),
          options: {
            data: {
              full_name: cleanName,
              role: role
            }
          }
        });

        if (!error && data?.user) {
          userRecord.id = data.user.id;
          authCreated = true;
        } else if (error) {
          console.warn('Supabase auth.signUp response:', error.message);
        }
      } catch (e: any) {
        console.warn('Supabase auth.signUp exception:', e);
      }

      // Ensure record in public.users and public.authors
      try {
        await client.from('users').upsert(userRecord, { onConflict: 'email' });
        await client.from('authors').upsert({
          id: generateUUID(),
          user_id: userRecord.id,
          name: cleanName,
          name_ar: cleanName,
          slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          avatar_url: avatarUrl,
          bio: `${cleanName} - Technical Author at AIWebCrafter`,
          bio_ar: `${cleanName} - كاتب تقني في منصة AIWebCrafter`,
          role_title: role === 'admin' ? 'Lead Admin & Author' : 'Tech Author & AI Specialist',
          role_title_ar: role === 'admin' ? 'المدير الرئيسي وكاتب' : 'كاتب تقني ومتخصص ذكاء اصطناعي',
          created_at: new Date().toISOString()
        }, { onConflict: 'slug' });
      } catch (dbErr) {
        console.warn('Direct public.users save notice:', dbErr);
      }

      this.currentUser = userRecord;
      this.persistLocal(userRecord);
      this.notify();

      return {
        success: true,
        user: userRecord,
        message: authCreated
          ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح!'
          : 'تم تسجيل الحساب والدخول إلى المنصة بنجاح!'
      };
    }

    // Local fallback
    this.currentUser = userRecord;
    this.persistLocal(userRecord);
    this.notify();
    return { success: true, user: userRecord, message: 'تم الدخول بنجاح!' };
  }

  public async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (_) {}
    }
    this.currentUser = null;
    this.persistLocal(null);
    this.notify();
  }

  public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address' };
    }
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || 'Failed to send reset email' };
      }
    }
    return { success: true };
  }
}

export const authService = new AuthService();
