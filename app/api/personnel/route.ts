import { NextRequest, NextResponse } from 'next/server';
import { PersonnelService } from '@/app/services/personnelService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      recherche: searchParams.get('recherche') || undefined,
      specialite: searchParams.get('specialite') || undefined,
      statut: searchParams.get('statut') || undefined,
      type_contrat: searchParams.get('type_contrat') || undefined,
      type_personnel: searchParams.get('type_personnel') || undefined,
      genre: searchParams.get('genre') || undefined,
      fonction: searchParams.get('fonction') || undefined,
      departement: searchParams.get('departement') || undefined
    };

    const resultat = await PersonnelService.obtenirPersonnel(filtres);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      personnel: resultat.personnel || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const personnelData = await request.json();
    
    // ✅ Essayer différentes méthodes possibles
    let resultat;
    
    // Liste des noms de méthodes possibles à essayer
    const methodesPossibles = [
      'creerPersonnel',
      'ajouterPersonnel',
      'creerEmploye',
      'ajouterEmploye',
      'savePersonnel',
      'createPersonnel',
      'addPersonnel'
    ];
    
    // Chercher la première méthode qui existe
    const methodeTrouvee = methodesPossibles.find(
      methode => typeof (PersonnelService as any)[methode] === 'function'
    );
    
    if (methodeTrouvee) {
      console.log(`✅ Méthode trouvée: PersonnelService.${methodeTrouvee}`);
      resultat = await (PersonnelService as any)[methodeTrouvee](personnelData);
    } else {
      // Si aucune méthode trouvée, afficher les méthodes disponibles
      const methodesDisponibles = Object.getOwnPropertyNames(PersonnelService)
        .filter(prop => typeof (PersonnelService as any)[prop] === 'function');
      
      console.error('❌ Méthodes disponibles:', methodesDisponibles);
      
      throw new Error(
        `Aucune méthode de création trouvée. Méthodes disponibles: ${methodesDisponibles.join(', ')}`
      );
    }
    
    if (!resultat || !resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat?.erreur || 'Erreur lors de la création' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      personnel: resultat.personnel || resultat.employe || resultat.data
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Erreur création personnel:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}