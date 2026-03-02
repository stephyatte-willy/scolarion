// components/PrintComponent.tsx
import React, { useRef, forwardRef, useImperativeHandle } from 'react';

interface PrintComponentProps {
  data: any;
  type: 'budgets' | 'depenses' | 'statistiques' | 'graphiques';
  filters?: any;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export interface PrintComponentRef {
  handlePrint: () => void;
}

export const PrintComponent = forwardRef<PrintComponentRef, PrintComponentProps>(({
  data,
  type,
  filters = {},
  onBeforePrint,
  onAfterPrint
}, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    handlePrint: () => {
      if (onBeforePrint) onBeforePrint();
      
      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Veuillez autoriser les popups pour l\'impression');
        return;
      }
      
      // Générer le contenu HTML pour l'impression
      const printContent = generatePrintContent(data, type, filters);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${getPrintTitle(type)}</title>
            <style>
              @page { 
                size: A4;
                margin: 20mm;
              }
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
              h1, h2, h3, h4 { page-break-after: avoid; }
              table { page-break-inside: avoid; border-collapse: collapse; width: 100%; }
              th, td { padding: 8px 12px; border: 1px solid #ddd; }
              th { background-color: #f8f9fa; font-weight: bold; }
              .total-row { background-color: #e9ecef; font-weight: bold; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #95a5a6; }
              .stat-card { background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px; }
              .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; }
              .badge-success { background-color: #28a745; }
              .badge-warning { background-color: #ffc107; }
              .badge-danger { background-color: #dc3545; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .row-even { background-color: #fff; }
              .row-odd { background-color: #f8f9fa; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Délai pour s'assurer que le contenu est chargé
      setTimeout(() => {
        printWindow.print();
        // Fermer la fenêtre après impression
        setTimeout(() => {
          printWindow.close();
        }, 500);
        
        if (onAfterPrint) onAfterPrint();
      }, 500);
    }
  }));

  return null; // Ce composant n'affiche rien dans le DOM
});

// Fonction utilitaire pour générer le contenu d'impression
const generatePrintContent = (data: any, type: string, filters: any) => {
  const getFormattedCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case 'depasse':
        return '<span class="badge badge-danger">Dépassé</span>';
      case 'en_alerte':
        return '<span class="badge badge-warning">En alerte</span>';
      case 'dans_les_normes':
        return '<span class="badge badge-success">Normal</span>';
      case 'annule':
        return '<span class="badge badge-danger">Annulée</span>';
      case 'en_attente':
        return '<span class="badge badge-warning">En attente</span>';
      case 'valide':
        return '<span class="badge badge-success">Validée</span>';
      default:
        return `<span class="badge">${statut}</span>`;
    }
  };

  // En-tête commun
  let html = `
    <div class="header">
      <h1>${getPrintTitle(type)}</h1>
      <p><strong>École - Gestion Financière</strong></p>
      <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
  `;

  // Section des filtres appliqués
  const activeFilters = Object.entries(filters).filter(([_, value]) => 
    value !== undefined && value !== '' && value !== 'Toutes' && value !== 'Tous'
  );

  if (activeFilters.length > 0) {
    html += `
      <div style="margin-top: 15px; text-align: left; display: inline-block;">
        <h3 style="margin: 10px 0 5px 0; font-size: 16px;">Filtres appliqués :</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${activeFilters.map(([key, value]) => `
            <li style="margin-bottom: 3px;"><strong>${key}:</strong> ${String(value)}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  html += `</div>`;

  // Contenu spécifique selon le type
  switch (type) {
case 'budgets':
  if (Array.isArray(data) && data.length > 0) {
    const totalAlloue = data.reduce((sum, b) => sum + (b.montant_alloue || 0), 0);
    const totalDepense = data.reduce((sum, b) => sum + (b.montant_depense || 0), 0);
    const totalReste = totalAlloue - totalDepense;
    
    html += `
      <h2>Liste des Budgets (${data.length})</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">N°</th>
            <th>Catégorie</th>
            <th class="text-right">Budget Alloué</th>
            <th class="text-right">Dépenses</th>
            <th class="text-right">Reste</th>
            <th class="text-center">Utilisation</th>
            <th class="text-center">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((budget, index) => `
            <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
              <td style="text-align: center; font-weight: bold; background-color: #f1f5f9;">${index + 1}</td>
              <td>${budget.categorie || 'Non spécifié'}</td>
              <td class="text-right">${getFormattedCurrency(budget.montant_alloue || 0)}</td>
              <td class="text-right">${getFormattedCurrency(budget.montant_depense || 0)}</td>
              <td class="text-right">${getFormattedCurrency((budget.montant_alloue || 0) - (budget.montant_depense || 0))}</td>
              <td class="text-center">${budget.pourcentage_utilisation ? budget.pourcentage_utilisation.toFixed(1) + '%' : '0.0%'}</td>
              <td class="text-center">${getStatutBadge(budget.statut)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2"><strong>TOTAL</strong></td>
            <td class="text-right"><strong>${getFormattedCurrency(totalAlloue)}</strong></td>
            <td class="text-right"><strong>${getFormattedCurrency(totalDepense)}</strong></td>
            <td class="text-right"><strong>${getFormattedCurrency(totalReste)}</strong></td>
            <td class="text-center"><strong>${totalAlloue > 0 ? ((totalDepense / totalAlloue) * 100).toFixed(1) + '%' : '0.0%'}</strong></td>
            <td class="text-center"><strong>${data.length} budgets</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
  }
  break;

// Pour les dépenses
case 'depenses':
  if (Array.isArray(data) && data.length > 0) {
    const totalMontant = data.reduce((sum, d) => sum + (d.montant || 0), 0);
    
    html += `
      <h2>Liste des Dépenses (${data.length})</h2>
      <table style="font-size: 14px;">
        <thead>
          <tr>
            <th style="width: 40px;">N°</th>
            <th>Date</th>
            <th>Description</th>
            <th>Catégorie Budget</th>
            <th>Type</th>
            <th>Bénéficiaire</th>
            <th class="text-right">Montant</th>
            <th class="text-center">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((depense, index) => `
            <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
              <td style="text-align: center; font-weight: bold; background-color: #f1f5f9;">${index + 1}</td>
              <td>${getFormattedDate(depense.date_depense)}</td>
              <td>${depense.description || ''}</td>
              <td>${depense.budget_categorie || 'Non spécifié'}</td>
              <td>${depense.type_depense || 'Non spécifié'}</td>
              <td>${depense.beneficiaire || ''}</td>
              <td class="text-right">${getFormattedCurrency(depense.montant || 0)}</td>
              <td class="text-center">${getStatutBadge(depense.statut)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" class="text-right"><strong>TOTAL :</strong></td>
            <td class="text-right"><strong>${getFormattedCurrency(totalMontant)}</strong></td>
            <td class="text-center"><strong>${data.length} dépenses</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
  }
  break;

    case 'depenses':
      if (Array.isArray(data) && data.length > 0) {
        const totalMontant = data.reduce((sum, d) => sum + (d.montant || 0), 0);
        
        html += `
          <h2>Liste des Dépenses (${data.length})</h2>
          <table style="font-size: 14px;">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie Budget</th>
                <th>Type</th>
                <th>Bénéficiaire</th>
                <th class="text-right">Montant</th>
                <th class="text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((depense, index) => `
                <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
                  <td>${getFormattedDate(depense.date_depense)}</td>
                  <td>${depense.description || ''}</td>
                  <td>${depense.budget_categorie || 'Non spécifié'}</td>
                  <td>${depense.type_depense || 'Non spécifié'}</td>
                  <td>${depense.beneficiaire || ''}</td>
                  <td class="text-right">${getFormattedCurrency(depense.montant || 0)}</td>
                  <td class="text-center">${getStatutBadge(depense.statut)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" class="text-right"><strong>TOTAL :</strong></td>
                <td class="text-right"><strong>${getFormattedCurrency(totalMontant)}</strong></td>
                <td class="text-center"><strong>${data.length} dépenses</strong></td>
              </tr>
            </tfoot>
          </table>
        `;
      } else {
        html += '<p>Aucune dépense à afficher.</p>';
      }
      break;

    case 'statistiques':
      html += `
        <h2>Statistiques Budgétaires</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
          <div class="stat-card">
            <h3 style="margin-top: 0; color: #2c3e50;">Synthèse Financière</h3>
            <table style="width: 100%;">
              <tbody>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Budget Total Alloué</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                    ${getFormattedCurrency(data.totalAlloue || 0)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Dépenses Total</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #e74c3c;">
                    ${getFormattedCurrency(data.totalDepense || 0)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Reste Disponible</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #27ae60;">
                    ${getFormattedCurrency((data.totalAlloue || 0) - (data.totalDepense || 0))}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">Taux d'Utilisation</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                    ${data.pourcentageUtilisation ? data.pourcentageUtilisation.toFixed(2) + '%' : '0.00%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="stat-card">
            <h3 style="margin-top: 0; color: #2c3e50;">Alertes Budget</h3>
            <table style="width: 100%;">
              <tbody>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Budgets Dépassés</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #e74c3c; font-weight: bold;">
                    ${data.budgetsDepasses || 0}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Budgets en Alerte</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #f39c12; font-weight: bold;">
                    ${data.budgetsEnAlerte || 0}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">Total Budgets</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                    ${data.totalBudgets || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        ${data.depensesParCategorie && data.depensesParCategorie.length > 0 ? `
          <div class="stat-card" style="grid-column: span 2;">
            <h3 style="margin-top: 0; color: #2c3e50;">Répartition par Catégorie</h3>
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th class="text-right">Montant</th>
                  <th class="text-right">Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                ${data.depensesParCategorie.map((cat: any, index: number) => `
                  <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
                    <td>${cat.categorie || 'Non spécifié'}</td>
                    <td class="text-right">${getFormattedCurrency(cat.montant || 0)}</td>
                    <td class="text-right">${cat.pourcentage ? cat.pourcentage.toFixed(2) + '%' : '0.00%'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      `;
      break;
  }

  // Pied de page
  html += `
    <div class="footer">
      <p>Document généré automatiquement par le système de gestion financière</p>
      <p>Page 1/1 - Confidentialité : Ce document est réservé à un usage interne</p>
    </div>
  `;

  return html;
};

const getPrintTitle = (type: string) => {
  switch(type) {
    case 'budgets': return 'Rapport des Budgets';
    case 'depenses': return 'Rapport des Dépenses';
    case 'statistiques': return 'Statistiques Budgétaires';
    case 'graphiques': return 'Graphiques Budgétaires';
    default: return 'Rapport';
  }
};