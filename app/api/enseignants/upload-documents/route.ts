import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Début upload documents enseignant');
    
    const formData = await request.formData();
    const enseignantId = formData.get('enseignant_id');
    const documents = formData.getAll('documents') as File[];
    const nomsFichiers = formData.getAll('noms_fichiers') as string[];

    console.log('🔍 Paramètres reçus:', {
      enseignantId,
      nombreDocuments: documents.length,
      nomsFichiers: nomsFichiers
    });

    if (!enseignantId) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant requis' },
        { status: 400 }
      );
    }

    const enseignantIdNum = parseInt(enseignantId.toString());
    if (isNaN(enseignantIdNum) || enseignantIdNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant invalide' },
        { status: 400 }
      );
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier que l'enseignant existe
    const sqlVerif = 'SELECT id, matricule FROM enseignants WHERE id = ?';
    console.log('🔍 Requête vérification enseignant:', sqlVerif, 'avec ID:', enseignantIdNum);
    
    const enseignants = await query(sqlVerif, [enseignantIdNum]) as any[];
    console.log('🔍 Résultat vérification:', enseignants);
    
    if (enseignants.length === 0) {
      return NextResponse.json(
        { success: false, erreur: `Enseignant non trouvé avec l'ID: ${enseignantIdNum}` },
        { status: 404 }
      );
    }

    const enseignant = enseignants[0];
    const documentsUploades = [];

    // Créer le dossier pour l'enseignant s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'enseignants', enseignantId.toString());
    console.log('📂 Chemin du dossier upload:', uploadDir);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log('✅ Dossier créé ou existant');
    } catch (error) {
      console.error('❌ Erreur création dossier:', error);
    }

    for (let i = 0; i < documents.length; i++) {
      const fichier = documents[i];
      const nomFichier = nomsFichiers[i] || fichier.name;
      const extension = path.extname(nomFichier);
      const nomUnique = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
      const cheminRelatif = `/uploads/enseignants/${enseignantId}/${nomUnique}`;
      const cheminAbsolu = path.join(uploadDir, nomUnique);

      console.log(`📄 Traitement fichier ${i + 1}/${documents.length}:`, {
        nomOriginal: nomFichier,
        nomUnique: nomUnique,
        taille: fichier.size,
        type: fichier.type
      });

      // Convertir le fichier en buffer
      const bytes = await fichier.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sauvegarder le fichier
      try {
        await fs.writeFile(cheminAbsolu, buffer);
        console.log('✅ Fichier sauvegardé:', cheminAbsolu);
      } catch (error) {
        console.error('❌ Erreur sauvegarde fichier:', error);
      }

      // Déterminer le type de document
      let typeDocument = 'Autre';
      if (extension.match(/\.(pdf)$/i)) typeDocument = 'PDF';
      else if (extension.match(/\.(doc|docx)$/i)) typeDocument = 'Document Word';
      else if (extension.match(/\.(xls|xlsx)$/i)) typeDocument = 'Document Excel';
      else if (extension.match(/\.(jpg|jpeg|png|gif)$/i)) typeDocument = 'Image';
      else if (extension.match(/\.(txt)$/i)) typeDocument = 'Texte';

      // Enregistrer dans la base de données
      const sql = `
        INSERT INTO documents_enseignants 
        (enseignant_id, nom_fichier, chemin_fichier, type_document, taille, date_upload)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      const params = [
        enseignantIdNum,
        nomFichier,
        cheminRelatif,
        typeDocument,
        fichier.size
      ];
      
      console.log('📝 Requête SQL:', sql);
      console.log('📝 Paramètres:', params);
      
      try {
        const result = await query(sql, params) as any;
        console.log('✅ Document inséré en base, ID:', result.insertId);
        
        documentsUploades.push({
          id: result.insertId,
          enseignant_id: enseignantIdNum,
          nom_fichier: nomFichier,
          chemin_fichier: cheminRelatif,
          type_document: typeDocument,
          taille: fichier.size,
          date_upload: new Date().toISOString()
        });
      } catch (error: any) {
        console.error('❌ Erreur insertion base de données:', error);
        console.error('❌ Code erreur:', error.code);
        console.error('❌ Message erreur:', error.message);
        
        // Supprimer le fichier physique si l'insertion échoue
        try {
          await fs.unlink(cheminAbsolu);
          console.log('🗑️ Fichier physique supprimé après erreur DB');
        } catch (deleteError) {
          console.error('⚠️ Impossible de supprimer le fichier physique:', deleteError);
        }
        
        throw new Error(`Erreur base de données: ${error.message}`);
      }
    }

    console.log(`✅ ${documentsUploades.length} document(s) uploadé(s) pour l'enseignant ${enseignantIdNum}`);
    
    return NextResponse.json({
      success: true,
      message: `${documentsUploades.length} document(s) uploadé(s) avec succès`,
      documents: documentsUploades
    });

  } catch (error: any) {
    console.error('❌ Erreur upload documents:', error);
    
    let messageErreur = `Erreur lors de l'upload: ${error.message}`;
    
    // Messages d'erreur plus conviviaux
    if (error.message.includes('foreign key constraint fails')) {
      messageErreur = 'L\'enseignant spécifié n\'existe pas dans la base de données.';
    } else if (error.message.includes('ER_NO_REFERENCED_ROW')) {
      messageErreur = 'L\'enseignant spécifié n\'existe pas. Veuillez d\'abord sauvegarder l\'enseignant.';
    } else if (error.message.includes('ENOENT')) {
      messageErreur = 'Erreur d\'accès au système de fichiers.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: messageErreur 
      },
      { status: 500 }
    );
  }
}