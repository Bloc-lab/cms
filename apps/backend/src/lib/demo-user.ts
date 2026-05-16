import { supabaseAdmin } from './supabase.js';

export async function profileIsDemo(userId: string | undefined | null): Promise<boolean> {
  if (!userId || !supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin.from('profiles').select('is_demo').eq('id', userId).maybeSingle();
  if (error || !data) return false;
  return (data as { is_demo?: boolean }).is_demo === true;
}
