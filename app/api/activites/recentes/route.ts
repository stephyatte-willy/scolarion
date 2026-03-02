import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Récupérer les activités récentes de votre base de données
    const activites = [
      {
        id: 1,
        type: 'inscription',
        titre: 'Nouvelle inscription',
        description: 'Jean Dupont s\'est inscrit en Terminale S',
        date: 'Il y a 5 min'
      },
      // ... autres activités
    ];
    
    return NextResponse.json({
      success: true,
      activites
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      activites: [],
      erreur: 'Erreur lors du chargement des activités'
    }, { status: 500 });
  }
}