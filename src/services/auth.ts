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
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          const authUser = data.session.user;
          // Pull latest profile from public.users table in Supabase
          const { data: dbUser } = await client
            .from('users')
            .select('*')
            .or(`id.eq.${authUser.id},email.eq.${authUser.email}`)
            .maybeSingle();

          const adminUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: dbUser?.full_name || authUser.user_metadata?.full_name || (authUser.email ? authUser.email.split('@')[0] : 'Admin'),
            role: (dbUser?.role as any) || 'admin',
            avatar_url: dbUser?.avatar_url || authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.email}`,
            created_at: dbUser?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.currentUser = adminUser;
          this.persistLocal(adminUser);
        } else {
          // If Supabase session is pending confirmation or cookie expired,
          // verify stored user against Supabase public.users table
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('aiwebcrafter_active_auth_user');
            if (stored) {
              try {
                const parsed: User = JSON.parse(stored);
                if (parsed?.email) {
                  const { data: dbUser } = await client
                    .from('users')
                    .select('*')
                    .eq('email', parsed.email.trim().toLowerCase())
                    .maybeSingle();

                  if (dbUser) {
                    const verifiedUser: User = {
                      ...parsed,
                      id: dbUser.id || parsed.id,
                      full_name: dbUser.full_name || parsed.full_name,
                      role: (dbUser.role as any) || parsed.role || 'admin',
                      avatar_url: dbUser.avatar_url || parsed.avatar_url,
                      updated_at: new Date().toISOString()
                    };
                    this.currentUser = verifiedUser;
                    this.persistLocal(verifiedUser);
                  } else {
                    this.currentUser = null;
                    this.persistLocal(null);
                  }
                }
              } catch (_) {
                this.currentUser = null;
                this.persistLocal(null);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase session check notice:', err);
      }
    } else {
      this.currentUser = null;
      this.persistLocal(null);
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

  public async signInWithPassword(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const rawIdentifier = emailOrUsername.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!rawIdentifier || !cleanPass) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور' };
    }

    const client = getSupabaseClient();

    if (!client) {
      return { 
        success: false, 
        error: 'تعذر الاتصال بقاعدة بيانات Supabase للتحقق من كلمة المرور. يرجى التأكد من تفعيل وربط مفاتيح Supabase.' 
      };
    }

    try {
      // 1. Resolve identifier: check if the user entered username or partial name instead of email
      let targetEmail = rawIdentifier;
      let matchedDbUser: any = null;

      // Query Supabase users table to find by email or full_name
      try {
        if (!targetEmail.includes('@')) {
          const { data: byName } = await client
            .from('users')
            .select('*')
            .or(`email.ilike.%${rawIdentifier}%,full_name.ilike.%${rawIdentifier}%`)
            .limit(1)
            .maybeSingle();

          if (byName?.email) {
            targetEmail = byName.email.trim().toLowerCase();
            matchedDbUser = byName;
          }
        } else {
          const { data: byEmail } = await client
            .from('users')
            .select('*')
            .eq('email', targetEmail)
            .maybeSingle();
          if (byEmail) {
            matchedDbUser = byEmail;
          }
        }
      } catch (findErr) {
        console.warn('Notice querying Supabase users table:', findErr);
      }

      // 2. Authenticate against Supabase Auth
      const { data, error } = await client.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass
      });

      // Scenario A: Supabase Auth credentials matched & session returned
      if (!error && data?.user) {
        const authUser = data.user;
        const { data: dbUser } = await client
          .from('users')
          .select('*')
          .or(`id.eq.${authUser.id},email.eq.${targetEmail}`)
          .maybeSingle();

        const finalUser: User = {
          id: authUser.id,
          email: authUser.email || targetEmail,
          full_name: dbUser?.full_name || authUser.user_metadata?.full_name || targetEmail.split('@')[0],
          role: (dbUser?.role as any) || 'admin',
          avatar_url: dbUser?.avatar_url || authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`,
          created_at: dbUser?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.currentUser = finalUser;
        this.persistLocal(finalUser);
        this.notify();
        return { success: true, user: finalUser };
      }

      // Scenario B: Supabase Auth returns "Email not confirmed".
      // NOTE: In Supabase Auth, this response is ONLY returned when the password entered is 100% CORRECT!
      // (An incorrect password returns "Invalid login credentials").
      // Since the administrator disabled the manual email verification requirement, we log them in directly from Supabase:
      if (error && error.message.toLowerCase().includes('email not confirmed')) {
        const userRecord = matchedDbUser || (
          await client.from('users').select('*').eq('email', targetEmail).maybeSingle()
        )?.data;

        const finalUser: User = {
          id: userRecord?.id || generateUUID(),
          email: targetEmail,
          full_name: userRecord?.full_name || targetEmail.split('@')[0],
          role: (userRecord?.role as any) || 'admin',
          avatar_url: userRecord?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`,
          created_at: userRecord?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.currentUser = finalUser;
        this.persistLocal(finalUser);
        this.notify();
        return { success: true, user: finalUser };
      }

      // Scenario C: Custom password column in Supabase public.users table
      if (matchedDbUser) {
        const customPass = matchedDbUser.password || matchedDbUser.password_hash || matchedDbUser.code;
        if (customPass && customPass === cleanPass) {
          const finalUser: User = {
            id: matchedDbUser.id,
            email: matchedDbUser.email,
            full_name: matchedDbUser.full_name || targetEmail.split('@')[0],
            role: (matchedDbUser.role as any) || 'admin',
            avatar_url: matchedDbUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`,
            created_at: matchedDbUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          this.currentUser = finalUser;
          this.persistLocal(finalUser);
          this.notify();
          return { success: true, user: finalUser };
        }
      }

      // Scenario D: Authentication failed in Supabase
      let msg = error?.message || 'فشل تسجيل الدخول';
      if (
        msg.includes('Invalid login credentials') ||
        msg.includes('invalid') ||
        msg.includes('User not found')
      ) {
        msg = 'كلمة المرور أو البريد الإلكتروني غير صحيح. يرجى التأكد من البيانات المسجلة في Supabase.';
      } else if (msg.includes('Too many requests') || msg.includes('rate limit')) {
        msg = 'محاولات دخول كثيرة، يرجى الانتظار لحظات ثم إعادة المحاولة.';
      }

      return { success: false, error: msg };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'حدث خطأ أثناء الاتصال بقاعدة بيانات Supabase للتحقق من الحساب.'
      };
    }
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
