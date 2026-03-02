// Créez le fichier : /pages/api/periodes-primaires/[id]/check-delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { id } = req.query;

  try {
    // Vérifier si la période existe
    const { data: periode, error: periodeError } = await supabase
      .from('periodes_primaire')
      .select('*')
      .eq('id', id)
      .single();

    if (periodeError || !periode) {
      return res.status(404).json({ error: 'Période non trouvée' });
    }

    // Vérifier si c'est la période courante
    if (periode.est_periode_courante) {
      return res.status(200).json({
        success: true,
        can_be_deleted: false,
        error: 'Impossible de supprimer la période courante'
      });
    }

    // Vérifier si la période est utilisée dans des compositions
    const { data: compositions, error: compError } = await supabase
      .from('compositions_primaire')
      .select('id')
      .eq('periode_id', id)
      .limit(1);

    if (compError) {
      console.error('Erreur vérification compositions:', compError);
    }

    // Vérifier si la période est utilisée dans des notes via les compositions
    const canBeDeleted = !compositions || compositions.length === 0;
    
    return res.status(200).json({
      success: true,
      can_be_deleted: canBeDeleted,
      compositions_count: compositions?.length || 0,
      error: !canBeDeleted ? 'Cette période ne peut pas être supprimée car elle est utilisée dans des compositions' : null
    });

  } catch (error) {
    console.error('Erreur vérification période:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification' 
    });
  }
}