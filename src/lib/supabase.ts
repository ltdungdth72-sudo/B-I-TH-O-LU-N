import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseClient: SupabaseClient | null = null;
let isConnected = false;

// Normalize Supabase URL in case the user pasted the dashboard URL or included trailing paths
export function normalizeSupabaseUrl(rawUrl: string): { url: string; error?: string } {
  let url = (rawUrl || '').trim();

  // If user pasted dashboard link, e.g. https://supabase.com/dashboard/project/xyz123...
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return { url: `https://${dashboardMatch[1]}.supabase.co` };
  }

  // Remove trailing slashes and /rest/v1 paths
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');

  // Add https:// if protocol is missing
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Check if it's still pointing to supabase.com dashboard without /project/
  if (url.includes('supabase.com/dashboard')) {
    return {
      url,
      error: 'Bạn đang dán link trình duyệt (Dashboard). Vui lòng vào: Supabase Dashboard -> Project Settings (biểu tượng bánh răng) -> API -> sao chép đúng mục "Project URL" (có dạng: https://xxxxxxxx.supabase.co).',
    };
  }

  return { url };
}

export function normalizeSupabaseKey(rawKey: string): string {
  return (rawKey || '').trim().replace(/^['"]|['"]$/g, '');
}

export function getSupabase(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  const { url } = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawKey);

  if (!url || !key) {
    supabaseClient = null;
    isConnected = false;
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      isConnected = true;
      console.log(`[Supabase] Client initialized for URL: ${url}`);
    } catch (err) {
      console.error('[Supabase] Initialization error:', err);
      supabaseClient = null;
      isConnected = false;
    }
  }

  return supabaseClient;
}

export function isSupabaseConnected(): boolean {
  return isConnected && Boolean(supabaseClient);
}

export async function testSupabaseConnection(
  rawUrl?: string,
  rawKey?: string
): Promise<{ success: boolean; message: string; normalizedUrl?: string }> {
  try {
    const inputUrl = rawUrl || process.env.SUPABASE_URL || '';
    const inputKey = rawKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!inputUrl || !inputKey) {
      return { success: false, message: 'Vui lòng điền đầy đủ cả Supabase URL và API Key.' };
    }

    const { url: testUrl, error: urlError } = normalizeSupabaseUrl(inputUrl);
    if (urlError) {
      return { success: false, message: urlError };
    }

    const testKey = normalizeSupabaseKey(inputKey);

    const client = createClient(testUrl, testKey);
    
    // 5-second timeout safeguard
    const queryPromise = client.from('classroom_config').select('id').limit(1);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hết thời gian kết nối (Timeout 5s). Vui lòng kiểm tra lại URL dự án Supabase.')), 5000)
    );

    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (error) {
      // If table doesn't exist yet, but credentials and URL are valid!
      if (error.code === '42P01') {
        return {
          success: true,
          normalizedUrl: testUrl,
          message: '✓ Kết nối tới Supabase thành công! (Lưu ý: Bảng "classroom_config" chưa được tạo. Hãy chạy file supabase_schema.sql trong SQL Editor trên Supabase).',
        };
      }
      return { success: false, message: `Lỗi Supabase: ${error.message}` };
    }

    return {
      success: true,
      normalizedUrl: testUrl,
      message: '✓ Kết nối Supabase thành công và đã nhận diện bảng dữ liệu!',
    };
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối: ${err.message || err}` };
  }
}
