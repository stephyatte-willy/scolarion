// /app/api/finance/export/route.ts - VERSION COMPLÈTE
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'excel';
    const type = searchParams.get('type') || 'depenses'; // 'budgets' ou 'depenses'
    
    console.log('📤 Export demandé - Type:', type, 'Format:', format);

    if (type === 'budgets') {
      return await exporterBudgets(searchParams, format);
    } else {
      return await exporterDepenses(searchParams, format);
    }

  } catch (error: any) {
    console.error('❌ Erreur export:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de l\'export des données',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function exporterBudgets(searchParams: URLSearchParams, format: string) {
  const anneeScolaire = searchParams.get('annee_scolaire');
  const categorie = searchParams.get('categorie');
  const statut = searchParams.get('statut');

  // Construire la requête SQL pour les budgets
  let sql = `
    SELECT 
      b.*,
      COALESCE(SUM(db.montant), 0) as montant_depense,
      CASE 
        WHEN b.montant_alloue > 0 THEN 
          ROUND((COALESCE(SUM(db.montant), 0) / b.montant_alloue) * 100, 1)
        ELSE 0
      END as pourcentage_utilisation,
      CASE 
        WHEN COALESCE(SUM(db.montant), 0) >= b.montant_alloue THEN 'depasse'
        WHEN (COALESCE(SUM(db.montant), 0) / b.montant_alloue) >= 0.8 THEN 'en_alerte'
        ELSE 'dans_les_normes'
      END as statut_calcule
    FROM budgets b
    LEFT JOIN depenses_budget db ON b.id = db.budget_id AND db.statut IN ('valide', 'paye')
    WHERE 1=1
  `;
  
  const params: any[] = [];

  if (anneeScolaire) {
    sql += ' AND b.annee_scolaire = ?';
    params.push(anneeScolaire);
  }

  if (categorie) {
    sql += ' AND b.categorie = ?';
    params.push(categorie);
  }

  if (statut) {
    sql += ' HAVING statut_calcule = ?';
    params.push(statut);
  }

  sql += ' GROUP BY b.id ORDER BY b.categorie';

  console.log('🔍 SQL Budgets:', sql);
  console.log('🔍 Params:', params);

  const budgets = await query(sql, params) as any[];
  
  console.log('✅ Nombre de budgets à exporter:', budgets.length);

  if (budgets.length === 0) {
    return NextResponse.json(
      { success: false, erreur: 'Aucun budget à exporter pour les critères sélectionnés' },
      { status: 404 }
    );
  }

  // Fonction pour obtenir le label d'une catégorie
  function getLabelCategorie(valeur: string): string {
    const categories: Record<string, string> = {
      'personnel': 'Personnel enseignant',
      'administratif': 'Personnel administratif',
      'fonctionnement': 'Fonctionnement général',
      'pedagogique': 'Matériel pédagogique',
      'maintenance': 'Maintenance des locaux',
      'fournitures': 'Fournitures scolaires',
      'equipement': 'Équipement informatique',
      'restauration': 'Restauration scolaire',
      'transport': 'Transport scolaire',
      'activites': 'Activités extrascolaires',
      'formation': 'Formation du personnel',
      'publicite': 'Publicité et communication',
      'frais_financiers': 'Frais financiers',
      'impots_taxes': 'Impôts et taxes',
      'divers': 'Divers'
    };
    return categories[valeur] || valeur;
  }

  function getLabelStatut(statut: string): string {
    switch (statut) {
      case 'dans_les_normes': return 'Dans les normes';
      case 'en_alerte': return 'En alerte';
      case 'depasse': return 'Dépassé';
      default: return statut;
    }
  }

  // Préparer les données pour l'export
  const donneesExport = budgets.map((budget, index) => {
    const pourcentage = budget.montant_alloue > 0 
      ? (budget.montant_depense / budget.montant_alloue) * 100 
      : 0;
    
    return {
      'N°': index + 1,
      'Catégorie': getLabelCategorie(budget.categorie),
      'Année scolaire': budget.annee_scolaire,
      'Budget alloué (FCFA)': Number(budget.montant_alloue),
      'Montant dépensé (FCFA)': Number(budget.montant_depense),
      'Reste disponible (FCFA)': Number(budget.montant_alloue) - Number(budget.montant_depense),
      'Taux d\'utilisation (%)': pourcentage.toFixed(1),
      'Statut': getLabelStatut(budget.statut_calcule),
      'Description': budget.description || '-',
      'Date création': new Date(budget.created_at).toLocaleDateString('fr-FR'),
      'Dernière modification': new Date(budget.updated_at).toLocaleDateString('fr-FR')
    };
  });

  // Calculer les totaux
  const totalAlloue = budgets.reduce((sum, b) => sum + Number(b.montant_alloue), 0);
  const totalDepense = budgets.reduce((sum, b) => sum + Number(b.montant_depense), 0);
  const totalReste = totalAlloue - totalDepense;
  
  // Métadonnées
  const metadata = {
    date_export: new Date().toLocaleDateString('fr-FR'),
    nombre_budgets: budgets.length,
    total_alloue: totalAlloue,
    total_depense: totalDepense,
    total_reste: totalReste,
    taux_utilisation_global: totalAlloue > 0 ? ((totalDepense / totalAlloue) * 100).toFixed(1) : '0.0',
    filtres_appliques: {
      annee_scolaire: anneeScolaire || 'Toutes',
      categorie: categorie ? getLabelCategorie(categorie) : 'Toutes',
      statut: statut ? getLabelStatut(statut) : 'Tous'
    }
  };

  // Créer le fichier selon le format
  switch (format) {
    case 'excel':
      return creerFichierExcelBudgets(donneesExport, metadata);
    case 'csv':
      return creerFichierCSVBudgets(donneesExport, metadata);
    case 'pdf':
      return creerFichierPDFBudgets(donneesExport, metadata);
    default:
      return creerFichierExcelBudgets(donneesExport, metadata);
  }
}

async function exporterDepenses(searchParams: URLSearchParams, format: string) {
  const dateDebut = searchParams.get('date_debut');
  const dateFin = searchParams.get('date_fin');
  const budgetId = searchParams.get('budget_id');
  const typeDepense = searchParams.get('type_depense');
  const modePaiement = searchParams.get('mode_paiement');
  const statut = searchParams.get('statut');
  const beneficiaire = searchParams.get('beneficiaire');
  const montantMin = searchParams.get('montant_min');
  const montantMax = searchParams.get('montant_max');
  const anneeScolaire = searchParams.get('annee_scolaire');

  console.log('📤 Paramètres dépenses:', { 
    dateDebut, dateFin, budgetId, typeDepense, modePaiement, statut, 
    beneficiaire, montantMin, montantMax, anneeScolaire 
  });

  // Construire la requête SQL avec tous les filtres
  let sql = `
    SELECT 
      d.id,
      d.description,
      d.montant,
      DATE_FORMAT(d.date_depense, '%d/%m/%Y') as date_depense,
      b.categorie as budget_categorie,
      d.type_depense,
      d.sous_categorie,
      d.beneficiaire,
      d.mode_paiement,
      d.numero_facture,
      d.reference,
      d.statut,
      d.notes,
      DATE_FORMAT(d.created_at, '%d/%m/%Y %H:%i') as created_at,
      DATE_FORMAT(d.updated_at, '%d/%m/%Y %H:%i') as updated_at,
      b.annee_scolaire
    FROM depenses_budget d
    LEFT JOIN budgets b ON d.budget_id = b.id
    WHERE 1=1
  `;
  
  const params: any[] = [];

  if (anneeScolaire) {
    sql += ' AND b.annee_scolaire = ?';
    params.push(anneeScolaire);
  }

  if (dateDebut) {
    sql += ' AND d.date_depense >= ?';
    params.push(dateDebut);
  }

  if (dateFin) {
    sql += ' AND d.date_depense <= ?';
    params.push(dateFin);
  }

  if (budgetId) {
    sql += ' AND d.budget_id = ?';
    params.push(budgetId);
  }

  if (typeDepense) {
    sql += ' AND d.type_depense = ?';
    params.push(typeDepense);
  }

  if (modePaiement) {
    sql += ' AND d.mode_paiement = ?';
    params.push(modePaiement);
  }

  if (statut) {
    sql += ' AND d.statut = ?';
    params.push(statut);
  }

  if (beneficiaire) {
    sql += ' AND d.beneficiaire LIKE ?';
    params.push(`%${beneficiaire}%`);
  }

  if (montantMin) {
    sql += ' AND d.montant >= ?';
    params.push(parseFloat(montantMin));
  }

  if (montantMax) {
    sql += ' AND d.montant <= ?';
    params.push(parseFloat(montantMax));
  }

  sql += ' ORDER BY d.date_depense DESC, d.created_at DESC';

  console.log('🔍 SQL Dépenses:', sql);
  console.log('🔍 Params:', params);

  const depenses = await query(sql, params) as any[];
  
  console.log('✅ Nombre de dépenses à exporter:', depenses.length);

  if (depenses.length === 0) {
    return NextResponse.json(
      { success: false, erreur: 'Aucune donnée à exporter pour les critères sélectionnés' },
      { status: 404 }
    );
  }

  // Fonctions utilitaires pour les labels
  function getLabelModePaiement(mode: string): string {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement bancaire',
      'carte': 'Carte bancaire',
      'mobile': 'Mobile Money',
      'autre': 'Autre'
    };
    return modes[mode] || mode;
  }

  function getLabelStatutDepense(statut: string): string {
    const statuts: Record<string, string> = {
      'valide': 'Validée',
      'en_attente': 'En attente',
      'annule': 'Annulée',
      'paye': 'Payée',
      'impaye': 'Impayée'
    };
    return statuts[statut] || statut;
  }

  function getLabelTypeDepense(type: string): string {
    const types: Record<string, string> = {
      'salaires': 'Salaires et charges sociales',
      'honoraires': 'Honoraires et consultations',
      'loyer': 'Loyers et charges locatives',
      'energie': 'Énergie et eau',
      'telecom': 'Télécommunications',
      'fournitures_bureau': 'Fournitures de bureau',
      'materiel_scolaire': 'Matériel scolaire',
      'maintenance_equipement': 'Maintenance d\'équipement',
      'frais_deplacement': 'Frais de déplacement',
      'publicite_marketing': 'Publicité et marketing',
      'formation': 'Formation et perfectionnement',
      'assurances': 'Assurances',
      'frais_bancaires': 'Frais bancaires',
      'impots_taxes': 'Impôts et taxes',
      'divers': 'Divers'
    };
    return types[type] || type;
  }

  function getLabelCategorie(valeur: string): string {
    const categories: Record<string, string> = {
      'personnel': 'Personnel enseignant',
      'administratif': 'Personnel administratif',
      'fonctionnement': 'Fonctionnement général',
      'pedagogique': 'Matériel pédagogique',
      'maintenance': 'Maintenance des locaux',
      'fournitures': 'Fournitures scolaires',
      'equipement': 'Équipement informatique',
      'restauration': 'Restauration scolaire',
      'transport': 'Transport scolaire',
      'activites': 'Activités extrascolaires',
      'formation': 'Formation du personnel',
      'publicite': 'Publicité et communication',
      'frais_financiers': 'Frais financiers',
      'impots_taxes': 'Impôts et taxes',
      'divers': 'Divers'
    };
    return categories[valeur] || valeur;
  }

  // Préparer les données pour l'export
  const donneesExport = depenses.map((depense, index) => ({
    'N°': index + 1,
    'Date dépense': depense.date_depense,
    'Description': depense.description,
    'Montant (FCFA)': Number(depense.montant),
    'Catégorie budget': getLabelCategorie(depense.budget_categorie),
    'Type dépense': getLabelTypeDepense(depense.type_depense),
    'Sous-catégorie': depense.sous_categorie || '-',
    'Bénéficiaire': depense.beneficiaire,
    'Mode paiement': getLabelModePaiement(depense.mode_paiement),
    'N° facture': depense.numero_facture || '-',
    'Référence': depense.reference || '-',
    'Statut': getLabelStatutDepense(depense.statut),
    'Notes': depense.notes || '-',
    'Date création': depense.created_at,
    'Dernière modif': depense.updated_at,
    'Année scolaire': depense.annee_scolaire
  }));

  // Calculer les totaux
  const totalMontant = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
  
  // Créer des métadonnées pour l'export
  const metadata = {
    date_export: new Date().toLocaleDateString('fr-FR'),
    nombre_depenses: depenses.length,
    total_montant: totalMontant,
    montant_moyen: depenses.length > 0 ? (totalMontant / depenses.length) : 0,
    filtres_appliques: {
      periode: dateDebut && dateFin ? `${dateDebut} à ${dateFin}` : 'Toute période',
      budget: budgetId ? `Budget ID: ${budgetId}` : 'Tous budgets',
      type_depense: typeDepense ? getLabelTypeDepense(typeDepense) : 'Tous types',
      mode_paiement: modePaiement ? getLabelModePaiement(modePaiement) : 'Tous modes',
      statut: statut ? getLabelStatutDepense(statut) : 'Tous statuts',
      beneficiaire: beneficiaire || 'Tous bénéficiaires',
      montant_range: montantMin || montantMax 
        ? `${montantMin || '0'} à ${montantMax || '∞'} FCFA` 
        : 'Tous montants'
    }
  };

  // Créer le fichier selon le format
  switch (format) {
    case 'excel':
      return creerFichierExcelDepenses(donneesExport, totalMontant, metadata);
    case 'csv':
      return creerFichierCSVDepenses(donneesExport, totalMontant, metadata);
    case 'pdf':
      return creerFichierPDFDepenses(donneesExport, totalMontant, metadata);
    default:
      return creerFichierExcelDepenses(donneesExport, totalMontant, metadata);
  }
}

// ============================================
// FONCTIONS POUR LES BUDGETS
// ============================================

function creerFichierExcelBudgets(donnees: any[], metadata: any) {
  const wb = XLSX.utils.book_new();
  
  // Feuille de métadonnées
  const metadataSheet = [
    ['EXPORT DES BUDGETS', ''],
    ['Date d\'export', metadata.date_export],
    ['Nombre de budgets', metadata.nombre_budgets],
    ['Total alloué', `${metadata.total_alloue.toLocaleString('fr-FR')} FCFA`],
    ['Total dépensé', `${metadata.total_depense.toLocaleString('fr-FR')} FCFA`],
    ['Total restant', `${metadata.total_reste.toLocaleString('fr-FR')} FCFA`],
    ['Taux d\'utilisation global', `${metadata.taux_utilisation_global}%`],
    [''],
    ['FILTRES APPLIQUÉS', ''],
    ['Année scolaire', metadata.filtres_appliques.annee_scolaire],
    ['Catégorie', metadata.filtres_appliques.categorie],
    ['Statut', metadata.filtres_appliques.statut],
    [''],
    ['DÉTAIL DES BUDGETS', '']
  ];
  
  const wsMetadata = XLSX.utils.aoa_to_sheet(metadataSheet);
  
  // Feuille de données
  const wsData = XLSX.utils.json_to_sheet(donnees);
  
  // Largeurs de colonnes
  wsData['!cols'] = [
    { wch: 5 },   // N°
    { wch: 30 },  // Catégorie
    { wch: 12 },  // Année scolaire
    { wch: 18 },  // Budget alloué
    { wch: 18 },  // Montant dépensé
    { wch: 18 },  // Reste disponible
    { wch: 15 },  // Taux d'utilisation
    { wch: 15 },  // Statut
    { wch: 40 },  // Description
    { wch: 12 },  // Date création
    { wch: 12 }   // Dernière modif
  ];
  
  // Ajouter les totaux
  if (donnees.length > 0) {
    const range = XLSX.utils.decode_range(wsData['!ref'] || 'A1');
    const totalRow = donnees.length + 1;
    
    XLSX.utils.sheet_add_aoa(wsData, [[]], { origin: totalRow });
    
    const ligneTotal = [
      'TOTAUX',
      '',
      '',
      metadata.total_alloue,
      metadata.total_depense,
      metadata.total_reste,
      `${metadata.taux_utilisation_global}%`,
      '',
      '',
      '',
      ''
    ];
    
    XLSX.utils.sheet_add_aoa(wsData, [ligneTotal], { origin: totalRow + 1 });
    
    // Mettre en forme la ligne de totaux
    ['D', 'E', 'F'].forEach(col => {
      const cell = `${col}${totalRow + 2}`;
      if (wsData[cell]) {
        wsData[cell].s = { font: { bold: true, color: { rgb: "FF0000" } } };
      }
    });
  }
  
  XLSX.utils.book_append_sheet(wb, wsMetadata, 'Informations');
  XLSX.utils.book_append_sheet(wb, wsData, 'Budgets');
  
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="export_budgets.xlsx"'
    }
  });
}

function creerFichierCSVBudgets(donnees: any[], metadata: any) {
  let csv = 'EXPORT DES BUDGETS\n';
  csv += `Date d'export,${metadata.date_export}\n`;
  csv += `Nombre de budgets,${metadata.nombre_budgets}\n`;
  csv += `Total alloué,${metadata.total_alloue.toLocaleString('fr-FR')} FCFA\n`;
  csv += `Total dépensé,${metadata.total_depense.toLocaleString('fr-FR')} FCFA\n`;
  csv += `Total restant,${metadata.total_reste.toLocaleString('fr-FR')} FCFA\n`;
  csv += `Taux d'utilisation global,${metadata.taux_utilisation_global}%\n\n`;
  
  csv += 'FILTRES APPLIQUÉS\n';
  csv += `Année scolaire,${metadata.filtres_appliques.annee_scolaire}\n`;
  csv += `Catégorie,${metadata.filtres_appliques.categorie}\n`;
  csv += `Statut,${metadata.filtres_appliques.statut}\n\n`;
  
  const headers = Object.keys(donnees[0] || {}).join(',');
  csv += headers + '\n';
  
  donnees.forEach(row => {
    const values = Object.values(row).map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });
  
  // Ajouter les totaux
  csv += '\n';
  csv += `TOTAUX,,,,${metadata.total_alloue},${metadata.total_depense},${metadata.total_reste},${metadata.taux_utilisation_global}%,,,,,\n`;
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="export_budgets.csv"'
    }
  });
}

function creerFichierPDFBudgets(donnees: any[], metadata: any) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Export Budgets - ${metadata.date_export}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .metadata { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 0.875rem; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .statut-dans_les_normes { background-color: #d1fae5; }
        .statut-en_alerte { background-color: #fef3c7; }
        .statut-depasse { background-color: #fee2e2; }
        @media print { 
          body { margin: 0; font-size: 10px; } 
          .no-print { display: none; } 
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <h1>💰 Export des Budgets</h1>
      
      <div class="metadata">
        <div><strong>Date d'export :</strong> ${metadata.date_export}</div>
        <div><strong>Filtres appliqués :</strong> 
          Année: ${metadata.filtres_appliques.annee_scolaire}, 
          Catégorie: ${metadata.filtres_appliques.categorie}, 
          Statut: ${metadata.filtres_appliques.statut}
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${metadata.nombre_budgets}</div>
          <div class="stat-label">Budgets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metadata.total_alloue.toLocaleString('fr-FR')} FCFA</div>
          <div class="stat-label">Total alloué</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metadata.total_depense.toLocaleString('fr-FR')} FCFA</div>
          <div class="stat-label">Total dépensé</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metadata.total_reste.toLocaleString('fr-FR')} FCFA</div>
          <div class="stat-label">Reste disponible</div>
        </div>
      </div>
      
      <h2>Détail des budgets</h2>
      
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Catégorie</th>
            <th>Budget alloué</th>
            <th>Dépensé</th>
            <th>Reste</th>
            <th>Utilisation</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map((row, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${row['Catégorie']}</td>
              <td>${row['Budget alloué (FCFA)'].toLocaleString('fr-FR')} FCFA</td>
              <td>${row['Montant dépensé (FCFA)'].toLocaleString('fr-FR')} FCFA</td>
              <td>${row['Reste disponible (FCFA)'].toLocaleString('fr-FR')} FCFA</td>
              <td>${row["Taux d'utilisation (%)"]}%</td>
              <td class="statut-${row['Statut'].toLowerCase().replace(' ', '_')}">
                ${row['Statut']}
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f1f5f9;">
            <td colspan="2">TOTAUX</td>
            <td>${metadata.total_alloue.toLocaleString('fr-FR')} FCFA</td>
            <td>${metadata.total_depense.toLocaleString('fr-FR')} FCFA</td>
            <td>${metadata.total_reste.toLocaleString('fr-FR')} FCFA</td>
            <td>${metadata.taux_utilisation_global}%</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="no-print" style="margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
          🖨️ Imprimer
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">
          ✕ Fermer
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="export_budgets.html"'
    }
  });
}

// ============================================
// FONCTIONS POUR LES DÉPENSES
// ============================================

function creerFichierExcelDepenses(donnees: any[], totalMontant: number, metadata: any) {
  // Créer un nouveau classeur
  const wb = XLSX.utils.book_new();
  
  // Créer une feuille pour les métadonnées
  const metadataSheet = [
    ['EXPORT DES DÉPENSES', ''],
    ['Date d\'export', metadata.date_export],
    ['Nombre de dépenses', metadata.nombre_depenses],
    ['Montant total', `${metadata.total_montant.toLocaleString('fr-FR')} FCFA`],
    ['Montant moyen', `${metadata.montant_moyen.toLocaleString('fr-FR')} FCFA`],
    [''],
    ['FILTRES APPLIQUÉS', ''],
    ['Période', metadata.filtres_appliques.periode],
    ['Budget', metadata.filtres_appliques.budget],
    ['Type de dépense', metadata.filtres_appliques.type_depense],
    ['Mode de paiement', metadata.filtres_appliques.mode_paiement],
    ['Statut', metadata.filtres_appliques.statut],
    ['Bénéficiaire', metadata.filtres_appliques.beneficiaire],
    ['Plage de montant', metadata.filtres_appliques.montant_range],
    [''],
    ['DÉTAIL DES DÉPENSES', '']
  ];
  
  const wsMetadata = XLSX.utils.aoa_to_sheet(metadataSheet);
  
  // Ajouter la feuille de données
  const wsData = XLSX.utils.json_to_sheet(donnees);
  
  // Définir les largeurs de colonnes
  const colWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // Date
    { wch: 40 },  // Description
    { wch: 15 },  // Montant
    { wch: 25 },  // Catégorie budget
    { wch: 25 },  // Type dépense
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
  wsData['!cols'] = colWidths;
  
  // Ajouter une ligne de totaux
  if (donnees.length > 0) {
    const range = XLSX.utils.decode_range(wsData['!ref'] || 'A1');
    range.e.r += 2; // Sauter une ligne avant le total
    
    // Ajouter une ligne vide
    XLSX.utils.sheet_add_aoa(wsData, [[]], { origin: -1 });
    
    // Ajouter le total
    const ligneTotal = [
      'TOTAL',
      '', '', '', '', '', '', '', '', '', '', '',
      `Total: ${totalMontant.toLocaleString('fr-FR')} FCFA`,
      '', '', ''
    ];
    
    XLSX.utils.sheet_add_aoa(wsData, [ligneTotal], { origin: -1 });
    
    // Mettre à jour la plage
    wsData['!ref'] = XLSX.utils.encode_range(range);
  }
  
  // Ajouter les feuilles au classeur
  XLSX.utils.book_append_sheet(wb, wsMetadata, 'Informations');
  XLSX.utils.book_append_sheet(wb, wsData, 'Dépenses');
  
  // Générer le buffer Excel
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Retourner la réponse
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="export_depenses.xlsx"'
    }
  });
}

function creerFichierCSVDepenses(donnees: any[], totalMontant: number, metadata: any) {
  // Créer l'en-tête CSV avec les métadonnées
  let csv = 'EXPORT DES DÉPENSES\n';
  csv += `Date d'export,${metadata.date_export}\n`;
  csv += `Nombre de dépenses,${metadata.nombre_depenses}\n`;
  csv += `Montant total,${metadata.total_montant.toLocaleString('fr-FR')} FCFA\n`;
  csv += `Montant moyen,${metadata.montant_moyen.toLocaleString('fr-FR')} FCFA\n\n`;
  csv += 'FILTRES APPLIQUÉS\n';
  csv += `Période,${metadata.filtres_appliques.periode}\n`;
  csv += `Budget,${metadata.filtres_appliques.budget}\n`;
  csv += `Type de dépense,${metadata.filtres_appliques.type_depense}\n`;
  csv += `Mode de paiement,${metadata.filtres_appliques.mode_paiement}\n`;
  csv += `Statut,${metadata.filtres_appliques.statut}\n`;
  csv += `Bénéficiaire,${metadata.filtres_appliques.beneficiaire}\n`;
  csv += `Plage de montant,${metadata.filtres_appliques.montant_range}\n\n`;
  
  // Ajouter les données
  const headers = Object.keys(donnees[0] || {}).join(',');
  csv += headers + '\n';
  
  donnees.forEach(row => {
    const values = Object.values(row).map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });
  
  // Ajouter le total
  csv += '\n';
  csv += `TOTAL,,,,,,,,,,,Total: ${totalMontant.toLocaleString('fr-FR')} FCFA,,,,\n`;
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="export_depenses.csv"'
    }
  });
}

function creerFichierPDFDepenses(donnees: any[], totalMontant: number, metadata: any) {
  // Pour PDF, nous allons retourner un HTML simplifié qui peut être imprimé
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Export Dépenses - ${metadata.date_export}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        .metadata { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .metadata-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 0.875rem; }
        .metadata-label { font-weight: bold; color: #475569; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .stat-value { font-size: 1.25rem; font-weight: bold; color: #10b981; }
        .stat-label { font-size: 0.875rem; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th { background-color: #10b981; color: white; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .total { font-weight: bold; color: #dc2626; font-size: 14px; margin-top: 20px; padding: 10px; background: #fee2e2; border-radius: 6px; }
        @media print {
          body { margin: 0; font-size: 9px; }
          .no-print { display: none; }
          h1 { font-size: 16px; }
          table { font-size: 8px; }
          .stats { grid-template-columns: repeat(2, 1fr); }
        }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #64748b; }
      </style>
    </head>
    <body>
      <h1>📝 Export des Dépenses</h1>
      
      <div class="metadata">
        <div class="metadata-grid">
          <div class="metadata-label">Date d'export :</div>
          <div>${metadata.date_export}</div>
          
          <div class="metadata-label">Nombre de dépenses :</div>
          <div>${metadata.nombre_depenses}</div>
          
          <div class="metadata-label">Montant total :</div>
          <div>${metadata.total_montant.toLocaleString('fr-FR')} FCFA</div>
          
          <div class="metadata-label">Montant moyen :</div>
          <div>${metadata.montant_moyen.toLocaleString('fr-FR')} FCFA</div>
          
          <div class="metadata-label">Filtres appliqués :</div>
          <div>
            ${Object.entries(metadata.filtres_appliques).map(([key, value]) => 
              `<div><strong>${key}:</strong> ${value}</div>`
            ).join('')}
          </div>
        </div>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${metadata.nombre_depenses}</div>
          <div class="stat-label">Dépenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metadata.total_montant.toLocaleString('fr-FR')} FCFA</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metadata.montant_moyen.toLocaleString('fr-FR')} FCFA</div>
          <div class="stat-label">Moyenne</div>
        </div>
      </div>
      
      <h2>Détail des dépenses</h2>
      
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Catégorie</th>
            <th>Bénéficiaire</th>
            <th>Mode paiement</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map((row, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${row['Date dépense']}</td>
              <td>${row['Description'].substring(0, 30)}${row['Description'].length > 30 ? '...' : ''}</td>
              <td>${row['Montant (FCFA)'].toLocaleString('fr-FR')} FCFA</td>
              <td>${row['Catégorie budget']}</td>
              <td>${row['Bénéficiaire'].substring(0, 20)}${row['Bénéficiaire'].length > 20 ? '...' : ''}</td>
              <td>${row['Mode paiement']}</td>
              <td>${row['Statut']}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        🏦 TOTAL : ${totalMontant.toLocaleString('fr-FR')} FCFA
      </div>
      
      <div class="footer">
        <p>Généré par le Système de Gestion Budgétaire - ${metadata.date_export}</p>
        <p>${metadata.nombre_depenses} dépenses exportées</p>
      </div>
      
      <div class="no-print" style="margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
          🖨️ Imprimer
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">
          ✕ Fermer
        </button>
      </div>
      
      <script>
        window.onload = function() {
          // Auto-impression optionnelle
          // setTimeout(() => window.print(), 1000);
        };
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="export_depenses.html"'
    }
  });
}