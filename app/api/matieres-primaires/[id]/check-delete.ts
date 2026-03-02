// Créez le fichier : /pages/api/matieres-primaires/[id]/check-delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { id } = req.query;

  try {
    // Vérifier si la matière existe
    const { data: matiere, error: matiereError } = await supabase
      .from('matieres_primaire')
      .select('*')
      .eq('id', id)
      .single();

    if (matiereError || !matiere) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    // Vérifier si la matière est utilisée dans des notes
    const { data: notes, error: notesError } = await supabase
      .from('notes_primaire')
      .select('id')
      .eq('matiere_id', id)
      .limit(1);

    if (notesError) {
      console.error('Erreur vérification notes:', notesError);
    }

    // Vérifier si la matière est utilisée dans des compositions
    const { data: compositions, error: compError } = await supabase
      .from('compositions_primaire')
      .select('id')
      .eq('matiere_id', id) // Adaptez selon votre schéma
      .limit(1);

    const canBeDeleted = !notes || notes.length === 0;
    
    return res.status(200).json({
      success: true,
      can_be_deleted: canBeDeleted,
      notes_count: notes?.length || 0,
      error: !canBeDeleted ? 'Cette matière ne peut pas être supprimée car elle est utilisée dans des notes' : null
    });

  } catch (error) {
    console.error('Erreur vérification matière:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification' 
    });
  }
}