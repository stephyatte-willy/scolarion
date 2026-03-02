import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Simuler des alertes pour le moment
    const alertesSimulees = [
      {
        id: 1,
        type: 'warning' as const,
        titre: 'Frais en retard',
        message: '5 frais sont en retard de paiement',
        date: new Date().toISOString(),
        priorite: 'haute' as const,
        statut: 'non_lu' as const
      },
      {
        id: 2,
        type: 'info' as const,
        titre: 'Rapport mensuel',
        message: 'Le rapport financier du mois est prêt',
        date: new Date(Date.now() - 86400000).toISOString(), // Hier
        priorite: 'moyenne' as const,
        statut: 'lu' as const
      },
      {
        id: 3,
        type: 'success' as const,
        titre: 'Objectif atteint',
        message: 'Taux de recouvrement > 90% ce mois-ci',
        date: new Date(Date.now() - 172800000).toISOString(), // Avant-hier
        priorite: 'basse' as const,
        statut: 'lu' as const
      }
    ];

    return NextResponse.json({
      success: true,
      alertes: alertesSimulees
    });
  } catch (error: any) {
    console.error('Erreur API alertes:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}