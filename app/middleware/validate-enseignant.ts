import { query } from '@/app/lib/database';

export async function validateEnseignantExists(enseignantId: number): Promise<boolean> {
  try {
    const sql = 'SELECT id FROM enseignants WHERE id = ?';
    const result = await query(sql, [enseignantId]) as any[];
    return result.length > 0;
  } catch (error) {
    console.error('Erreur validation enseignant:', error);
    return false;
  }
}