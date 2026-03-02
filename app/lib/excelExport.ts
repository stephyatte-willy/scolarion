// app/lib/excelExport.ts
import * as XLSX from 'xlsx';

interface ExportOptions {
  titre?: string;
  auteur?: string;
  inclureTotal?: boolean;
}

export function exporterVersExcel(
  donnees: any[], 
  nomFeuille: string = 'Données',
  options: ExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  
  // Préparer les données avec les en-têtes
  const ws = XLSX.utils.json_to_sheet(donnees);
  
  // Appliquer la mise en forme
  if (options.inclureTotal !== false && donnees.length > 0) {
    // Ajouter une ligne de total si nécessaire
    const montants = donnees.map(d => d['Montant (FCFA)'] || 0);
    const total = montants.reduce((a, b) => a + b, 0);
    
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    range.e.r += 2; // Sauter une ligne avant le total
    
    // Ajouter une ligne vide
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
    
    // Ajouter le total
    const ligneTotal = [
      'TOTAL',
      '', '', '', '', '', '', '', '', '', '', '',
      `Total: ${total.toLocaleString('fr-FR')} FCFA`,
      '', '', ''
    ];
    
    XLSX.utils.sheet_add_aoa(ws, [ligneTotal], { origin: -1 });
    
    // Mettre à jour la plage
    ws['!ref'] = XLSX.utils.encode_range(range);
  }
  
  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 5 },   // N°
    { wch: 12 },  // Date
    { wch: 40 },  // Description
    { wch: 15 },  // Montant
    { wch: 25 },  // Catégorie budget
    { wch: 20 },  // Type dépense
    { wch: 20 },  // Sous-catégorie
    { wch: 25 },  // Bénéficiaire
    { wch: 15 },  // Mode paiement
    { wch: 15 },  // N° facture
    { wch: 15 },  // Référence
    { wch: 12 },  // Statut
    { wch: 30 },  // Notes
    { wch: 18 },  // Date création
    { wch: 18 },  // Dernière modif
    { wch: 12 }   // Année scolaire
  ];
  
  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(wb, ws, nomFeuille);
  
  // Ajouter des métadonnées
  if (options.titre || options.auteur) {
    wb.Props = {
      Title: options.titre || 'Export Dépenses',
      Author: options.auteur || 'Système de Gestion Budgétaire',
      CreatedDate: new Date()
    };
  }
  
  return wb;
}