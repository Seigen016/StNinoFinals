import { Database } from '@/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes an RFID card value for comparison — same rule the ESP32-facing
 * check-rfid endpoint already uses, so scanned cards match consistently
 * regardless of case/whitespace/leading zeros.
 */
export function normalizeRfid(raw: string): string {
  return (raw || '').toString().trim().toUpperCase().replace(/\s+/g, '');
}

export interface RfidOwner {
  id: string;
  name: string;
  role: string;
}

/**
 * Finds whoever currently holds a given RFID card, excluding a specific
 * user id (the record being saved). Returns null if the card is unassigned.
 */
export async function findRfidOwner(
  admin: SupabaseClient<Database>,
  rfid: string,
  excludeUserId?: string
): Promise<RfidOwner | null> {
  const normalized = normalizeRfid(rfid);
  if (!normalized) return null;

  const { data } = await admin
    .from('users')
    .select('id, first_name, last_name, role, rfid')
    .not('rfid', 'is', null)
    .limit(2000);

  const match = (data || []).find((u: any) => {
    if (excludeUserId && u.id === excludeUserId) return false;
    return normalizeRfid(u.rfid) === normalized;
  });

  if (!match) return null;

  return {
    id: match.id,
    name: `${match.first_name || ''} ${match.last_name || ''}`.trim() || 'Unknown',
    role: match.role || 'user',
  };
}
