// services/exportService.ts
import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  dateFormat?: string;
  includeHeaders?: boolean;
}

export class ExportService {
  
  // Exporter les budgets
// Modifier exportBudgetsToExcel
static exportBudgetsToExcel(budgets: any[], options: ExportOptions = {}) {
  const {
    filename = `budgets_${this.getCurrentDate()}.xlsx`,
    sheetName = 'Budgets',
    dateFormat = 'DD/MM/YYYY',
    includeHeaders = true
  } = options;

  // Formater les données pour Excel avec numérotation
  const formattedData = budgets.map((budget, index) => ({
    'N°': index + 1,
    'ID': budget.id,
    'Année Scolaire': budget.annee_scolaire,
    'Catégorie': budget.categorie,
    'Montant Alloué': budget.montant_alloue,
    'Montant Dépensé': budget.montant_depense,
    'Reste Disponible': budget.montant_alloue - budget.montant_depense,
    'Taux Utilisation': `${budget.pourcentage_utilisation?.toFixed(2)}%`,
    'Statut': this.translateStatut(budget.statut),
    'Description': budget.description || '',
    'Date Création': this.formatDate(budget.created_at, dateFormat),
    'Date Modification': this.formatDate(budget.updated_at, dateFormat)
  }));

  this.exportToExcel(formattedData, sheetName, filename, includeHeaders);
}

// Modifier exportDepensesToExcel
static exportDepensesToExcel(depenses: any[], options: ExportOptions = {}) {
  const {
    filename = `depenses_${this.getCurrentDate()}.xlsx`,
    sheetName = 'Dépenses',
    dateFormat = 'DD/MM/YYYY',
    includeHeaders = true
  } = options;

  // Formater les données pour Excel avec numérotation
  const formattedData = depenses.map((depense, index) => ({
    'N°': index + 1,
    'ID': depense.id,
    'Budget ID': depense.budget_id,
    'Catégorie Budget': depense.budget_categorie,
    'Type Dépense': depense.type_depense,
    'Sous-catégorie': depense.sous_categorie || '',
    'Description': depense.description,
    'Montant': depense.montant,
    'Date Dépense': this.formatDate(depense.date_depense, dateFormat),
    'Mode Paiement': this.translateModePaiement(depense.mode_paiement),
    'Numéro Facture': depense.numero_facture || '',
    'Bénéficiaire': depense.beneficiaire,
    'Référence': depense.reference || '',
    'Statut': this.translateStatutDepense(depense.statut),
    'Notes': depense.notes || '',
    'Date Création': this.formatDate(depense.created_at, dateFormat),
    'Date Modification': this.formatDate(depense.updated_at, dateFormat)
  }));

  this.exportToExcel(formattedData, sheetName, filename, includeHeaders);
}

  // Exporter les statistiques
  static exportStatistiquesToExcel(statistiques: any, options: ExportOptions = {}) {
    const {
      filename = `statistiques_budget_${this.getCurrentDate()}.xlsx`,
      includeHeaders = true
    } = options;

    // Créer un classeur avec plusieurs feuilles
    const wb = XLSX.utils.book_new();

    // Feuille 1: Statistiques globales
    const statsData = [
      ['Statistiques Budgétaires', ''],
      ['Total Budgets', statistiques.totalBudgets],
      ['Budget Total Alloué', statistiques.totalAlloue],
      ['Dépenses Total', statistiques.totalDepense],
      ['Reste à Planifier', statistiques.totalAlloue - statistiques.totalDepense],
      ['Taux d\'Utilisation', `${statistiques.pourcentageUtilisation.toFixed(2)}%`],
      ['Budgets Dépassés', statistiques.budgetsDepasses],
      ['Budgets en Alerte', statistiques.budgetsEnAlerte],
      ['', ''],
      ['Date d\'export', new Date().toLocaleDateString('fr-FR')]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Statistiques');

    // Feuille 2: Dépenses par catégorie
    if (statistiques.depensesParCategorie && statistiques.depensesParCategorie.length > 0) {
      const catData = [
        ['Catégorie', 'Montant', 'Pourcentage'],
        ...statistiques.depensesParCategorie.map((cat: any) => [
          cat.categorie,
          cat.montant,
          `${cat.pourcentage?.toFixed(2)}%`
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(catData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Par Catégorie');
    }

    // Feuille 3: Dépenses par mois
    if (statistiques.depensesParMois && statistiques.depensesParMois.length > 0) {
      const moisData = [
        ['Mois', 'Montant'],
        ...statistiques.depensesParMois.map((mois: any) => [
          mois.mois,
          mois.montant
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(moisData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Par Mois');
    }

    // Générer le fichier Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Utiliser une méthode alternative à saveAs
    this.downloadExcelFile(wbout, filename);
  }

  // Fonction générique d'export Excel
  static exportToExcel(data: any[], sheetName: string, filename: string, includeHeaders: boolean = true) {
    // Créer une feuille de calcul
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajuster la largeur des colonnes
    const wscols = Object.keys(data[0] || {}).map(() => ({ width: 20 }));
    ws['!cols'] = wscols;
    
    // Créer un classeur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Générer le fichier Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Télécharger le fichier
    this.downloadExcelFile(wbout, filename);
  }

  // Exporter les graphiques
  static exportGraphiques(graphiquesData: any[], options: ExportOptions = {}) {
    const {
      filename = `graphiques_budget_${this.getCurrentDate()}.xlsx`
    } = options;

    const wb = XLSX.utils.book_new();

    // Pour chaque graphique, créer une feuille avec les données
    graphiquesData.forEach((graphique, index) => {
      if (graphique.data && graphique.data.length > 0) {
        const sheetData = [
          [graphique.title],
          ...graphique.headers,
          ...graphique.data.map((row: any) => Object.values(row))
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, graphique.title.substring(0, 31) || `Graphique${index + 1}`);
      }
    });

    // Ajouter une feuille avec les métadonnées
    const metaData = [
      ['Rapport des Graphiques Budgétaires'],
      [''],
      ['Date de génération', new Date().toLocaleDateString('fr-FR')],
      ['Heure de génération', new Date().toLocaleTimeString('fr-FR')],
      ['Nombre de graphiques', graphiquesData.length]
    ];
    
    const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Métadonnées');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.downloadExcelFile(wbout, filename);
  }

  // Méthode alternative pour télécharger le fichier Excel
  private static downloadExcelFile(data: any, filename: string) {
  // S'assurer que data est un tableau d'octets
  const buffer = Array.isArray(data) ? new Uint8Array(data) : data;
  
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

  // Méthodes utilitaires
  private static formatDate(dateString: string, format: string = 'DD/MM/YYYY'): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    switch (format) {
      case 'DD/MM/YYYY':
        return date.toLocaleDateString('fr-FR');
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('fr-FR');
    }
  }

  private static translateStatut(statut: string): string {
    const translations: Record<string, string> = {
      'dans_les_normes': 'Dans les normes',
      'en_alerte': 'En alerte',
      'depasse': 'Dépassé'
    };
    return translations[statut] || statut;
  }

  private static translateStatutDepense(statut: string): string {
    const translations: Record<string, string> = {
      'valide': 'Validée',
      'en_attente': 'En attente',
      'annule': 'Annulée',
      'paye': 'Payée',
      'impaye': 'Impayée'
    };
    return translations[statut] || statut;
  }

  private static translateModePaiement(mode: string): string {
    const translations: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'carte': 'Carte bancaire',
      'mobile': 'Mobile Money',
      'autre': 'Autre'
    };
    return translations[mode] || mode;
  }

  private static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}