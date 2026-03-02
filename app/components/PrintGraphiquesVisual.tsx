import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintGraphiquesVisualProps {
  statistiques: any;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface GraphiqueComponentRef {
  getCanvas: () => HTMLCanvasElement | null;
}

// Fonction utilitaire pour formater les montants
const formaterMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant);
};

// Fonction utilitaire pour formater les montants compacts
const formaterMontantCompact = (montant: number) => {
  if (montant >= 1000000) {
    return formaterMontant(montant / 1000000) + 'M';
  } else if (montant >= 1000) {
    return formaterMontant(montant / 1000) + 'k';
  }
  return formaterMontant(montant);
};

// Graphique Pie amélioré
const GraphiquePie = forwardRef<GraphiqueComponentRef, { data: any[] }>(({ data }, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dimensions optimisées pour PDF
    const width = 800; // Largeur réduite pour mieux tenir dans le PDF
    const height = 500; // Hauteur réduite
    canvas.width = width;
    canvas.height = height;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60; // Marge plus grande
    
    // Nettoyer avec fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Titre
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Répartition des Dépenses par Catégorie', width / 2, 35);
    
    // Calculer le total
    const total = data.reduce((sum, item) => sum + (item.montant || 0), 0);
    if (total === 0) return;
    
    // Couleurs améliorées pour meilleur contraste
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6',
      '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    // Dessiner le graphique circulaire
    let startAngle = -Math.PI / 2; // Commencer à 12h
    
    data.forEach((item, index) => {
      const sliceAngle = (item.montant / total) * 2 * Math.PI;
      
      // Dessiner la section avec effet d'ombre
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.restore();
      
      // Ajouter le label uniquement si la section est assez grande
      const percent = ((item.montant / total) * 100);
      if (percent >= 5) { // Seulement si > 5%
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percent.toFixed(1)}%`, labelX, labelY);
      }
      
      startAngle += sliceAngle;
    });
    
    // Légende à droite, mieux organisée
    const legendX = width - 250;
    let legendY = 80;
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'left';
    ctx.fillText('Légende:', legendX, legendY - 10);
    
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Afficher seulement les 8 premières catégories principales
    const displayedData = data.slice(0, 8);
    
    displayedData.forEach((item, index) => {
      // Carré de couleur
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, legendY, 15, 15);
      
      // Texte tronqué si trop long
      let label = item.categorie || `Catégorie ${index + 1}`;
      if (label.length > 20) {
        label = label.substring(0, 17) + '...';
      }
      
      // Nom et montant
      ctx.fillStyle = '#333333';
      ctx.fillText(`${label}:`, legendX + 20, legendY + 12);
      
      // Montant aligné à droite
      ctx.textAlign = 'right';
      ctx.fillText(
        formaterMontantCompact(item.montant),
        legendX + 200,
        legendY + 12
      );
      ctx.textAlign = 'left';
      
      legendY += 25;
    });
    
    // Total en bas
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${formaterMontant(total)}`, width / 2, height - 20);
    
  }, [data]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'none' }}
    />
  );
});

// Graphique Ligne amélioré
const GraphiqueLigne = forwardRef<GraphiqueComponentRef, { data: any[] }>(({ data }, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dimensions optimisées
    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;
    
    const margin = { top: 50, right: 50, bottom: 70, left: 80 }; // Marge gauche augmentée
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;
    
    // Nettoyer avec fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Titre
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Évolution des Dépenses par Mois', width / 2, 30);
    
    // Trouver les valeurs max/min
    const values = data.map(d => d.montant);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || maxValue || 1;
    
    // Échelles améliorées
    const xScale = (index: number) => 
      margin.left + (index * graphWidth) / Math.max(1, data.length - 1);
    
    const yScale = (value: number) => 
      margin.top + graphHeight - ((value - minValue) / range) * graphHeight;
    
    // Grille plus subtile
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    
    // Lignes horizontales
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * graphHeight) / gridLines;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Labels Y avec meilleur espacement
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * graphHeight) / gridLines;
      const value = minValue + ((gridLines - i) * range) / gridLines;
      
      // Position du label plus à gauche
      ctx.fillText(
        formaterMontantCompact(value),
        margin.left - 10, // Position décalée
        y
      );
    }
    
    // Axe X
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(width - margin.right, margin.top + graphHeight);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Labels X avec rotation pour plus d'espace
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = margin.top + graphHeight + 10;
      
      // Sauvegarder l'état du contexte
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4); // Rotation de 45 degrés
      ctx.fillText(point.mois || `M${index + 1}`, 0, 0);
      ctx.restore();
    });
    
    // Axe Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.stroke();
    
    // Points et lignes avec effets
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#3b82f6';
    
    // Ligne avec dégradé
    const lineGradient = ctx.createLinearGradient(
      margin.left, 0, 
      width - margin.right, 0
    );
    lineGradient.addColorStop(0, '#3b82f6');
    lineGradient.addColorStop(1, '#8b5cf6');
    ctx.strokeStyle = lineGradient;
    
    // Dessiner la ligne
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.montant);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Points avec effets
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.montant);
      
      // Point extérieur avec effet brillant
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
      pointGradient.addColorStop(0, '#ffffff');
      pointGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = pointGradient;
      ctx.fill();
      
      // Point intérieur
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      // Valeur au-dessus du point avec fond
      if (point.montant > 0) {
        const valueText = formaterMontantCompact(point.montant);
        const textWidth = ctx.measureText(valueText).width;
        
        // Fond pour le texte
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          x - textWidth / 2 - 5, 
          y - 35, 
          textWidth + 10, 
          20
        );
        
        // Bordure
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x - textWidth / 2 - 5, 
          y - 35, 
          textWidth + 10, 
          20
        );
        
        // Texte
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valueText, x, y - 25);
      }
    });
    
  }, [data]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'none' }}
    />
  );
});

// Graphique Barres amélioré
const GraphiqueBarres = forwardRef<GraphiqueComponentRef, { data: any[] }>(({ data }, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dimensions optimisées
    const width = 800;
    const height = 550; // Hauteur augmentée pour les labels
    canvas.width = width;
    canvas.height = height;
    
    const margin = { top: 50, right: 50, bottom: 120, left: 100 }; // Marges augmentées
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;
    
    // Nettoyer avec fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Titre
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Budget vs Dépenses par Catégorie', width / 2, 30);
    
    // Trouver les valeurs max
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.alloue || 0, d.depense || 0))
    ) || 1;
    
    // Bar width et espacement améliorés
    const barGroupWidth = graphWidth / data.length;
    const barWidth = barGroupWidth * 0.3;
    const spaceBetweenBars = barGroupWidth * 0.2;
    const groupPadding = (barGroupWidth - (barWidth * 2 + spaceBetweenBars)) / 2;
    
    // Échelle Y
    const yScale = (value: number) => 
      margin.top + graphHeight - (value / maxValue) * graphHeight;
    
    // Grille
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * graphHeight) / gridLines;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Labels Y
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * graphHeight) / gridLines;
      const value = ((gridLines - i) * maxValue) / gridLines;
      
      ctx.fillText(
        formaterMontantCompact(value),
        margin.left - 15,
        y
      );
    }
    
    // Axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    // Axe X
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(width - margin.right, margin.top + graphHeight);
    ctx.stroke();
    
    // Axe Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.stroke();
    
    // Barres
    data.forEach((item, index) => {
      const groupStartX = margin.left + index * barGroupWidth + groupPadding;
      
      // Barre Budget (vert)
      const budgetValue = item.alloue || 0;
      const budgetHeight = graphHeight * (budgetValue / maxValue);
      const budgetY = margin.top + graphHeight - budgetHeight;
      const budgetX = groupStartX;
      
      // Dégradé pour la barre budget
      const budgetGradient = ctx.createLinearGradient(
        budgetX, budgetY, 
        budgetX, budgetY + budgetHeight
      );
      budgetGradient.addColorStop(0, '#10b981');
      budgetGradient.addColorStop(1, '#059669');
      
      ctx.fillStyle = budgetGradient;
      ctx.fillRect(budgetX, budgetY, barWidth, budgetHeight);
      
      // Effet 3D sur les bords
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(budgetX, budgetY, barWidth, budgetHeight);
      
      // Barre Dépenses (bleu)
      const depenseValue = item.depense || 0;
      const depenseHeight = graphHeight * (depenseValue / maxValue);
      const depenseY = margin.top + graphHeight - depenseHeight;
      const depenseX = groupStartX + barWidth + spaceBetweenBars;
      
      // Dégradé pour la barre dépenses
      const depenseGradient = ctx.createLinearGradient(
        depenseX, depenseY, 
        depenseX, depenseY + depenseHeight
      );
      depenseGradient.addColorStop(0, '#3b82f6');
      depenseGradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = depenseGradient;
      ctx.fillRect(depenseX, depenseY, barWidth, depenseHeight);
      ctx.strokeRect(depenseX, depenseY, barWidth, depenseHeight);
      
      // Label catégorie en bas avec rotation
      const labelX = groupStartX + barWidth + spaceBetweenBars / 2;
      const labelY = margin.top + graphHeight + 20;
      
      // Tronquer le label si trop long
      let label = item.mois || `Cat ${index + 1}`;
      if (label.length > 15) {
        label = label.substring(0, 12) + '...';
      }
      
      ctx.save();
      ctx.translate(labelX, labelY);
      ctx.rotate(-Math.PI / 4); // Rotation de 45 degrés
      ctx.fillStyle = '#333333';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, 0, 0);
      ctx.restore();
      
      // Valeurs sur les barres (seulement si assez de place)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      
      // Valeur budget
      if (budgetHeight > 25) {
        ctx.save();
        ctx.translate(budgetX + barWidth / 2, budgetY + budgetHeight / 2);
        
        // Fond pour le texte
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        const budgetText = formaterMontantCompact(budgetValue);
        const budgetTextWidth = ctx.measureText(budgetText).width;
        ctx.fillRect(-budgetTextWidth / 2 - 3, -8, budgetTextWidth + 6, 16);
        
        // Texte
        ctx.fillStyle = '#ffffff';
        ctx.fillText(budgetText, 0, 0);
        ctx.restore();
      }
      
      // Valeur dépenses
      if (depenseHeight > 25) {
        ctx.save();
        ctx.translate(depenseX + barWidth / 2, depenseY + depenseHeight / 2);
        
        // Fond pour le texte
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        const depenseText = formaterMontantCompact(depenseValue);
        const depenseTextWidth = ctx.measureText(depenseText).width;
        ctx.fillRect(-depenseTextWidth / 2 - 3, -8, depenseTextWidth + 6, 16);
        
        // Texte
        ctx.fillStyle = '#ffffff';
        ctx.fillText(depenseText, 0, 0);
        ctx.restore();
      }
    });
    
    // Légende en haut à droite
    const legendX = width - 200;
    let legendY = margin.top - 20;
    
    // Légende Budget
    const budgetLegendGradient = ctx.createLinearGradient(
      legendX, legendY, 
      legendX + 20, legendY + 20
    );
    budgetLegendGradient.addColorStop(0, '#10b981');
    budgetLegendGradient.addColorStop(1, '#059669');
    
    ctx.fillStyle = budgetLegendGradient;
    ctx.fillRect(legendX, legendY, 20, 20);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, 20, 20);
    
    ctx.fillStyle = '#333333';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Budget alloué', legendX + 25, legendY + 15);
    
    // Légende Dépenses
    const depenseLegendGradient = ctx.createLinearGradient(
      legendX, legendY + 30, 
      legendX + 20, legendY + 50
    );
    depenseLegendGradient.addColorStop(0, '#3b82f6');
    depenseLegendGradient.addColorStop(1, '#1d4ed8');
    
    ctx.fillStyle = depenseLegendGradient;
    ctx.fillRect(legendX, legendY + 30, 20, 20);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(legendX, legendY + 30, 20, 20);
    
    ctx.fillStyle = '#333333';
    ctx.fillText('Dépenses réelles', legendX + 25, legendY + 45);
    
  }, [data]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'none' }}
    />
  );
});

// Composant principal
export const PrintGraphiquesVisual: React.FC<PrintGraphiquesVisualProps> = ({
  statistiques,
  onBeforePrint,
  onAfterPrint,
  disabled,
  children
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Références pour les composants graphiques
  const pieRef = React.useRef<GraphiqueComponentRef>(null);
  const ligneRef = React.useRef<GraphiqueComponentRef>(null);
  const barresRef = React.useRef<GraphiqueComponentRef>(null);

  const captureCanvasAsImage = (canvas: HTMLCanvasElement | null): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!canvas) {
        reject(new Error('Canvas non disponible'));
        return;
      }
      
      try {
        // Créer un canvas temporaire avec haute qualité
        const tempCanvas = document.createElement('canvas');
        const scale = 2; // Facteur d'échelle pour meilleure qualité
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Context canvas non disponible'));
          return;
        }
        
        // Rendre l'image plus nette
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Appliquer un fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Dessiner le canvas original mis à l'échelle
        ctx.scale(scale, scale);
        ctx.drawImage(canvas, 0, 0);
        
        // Convertir en image PNG haute qualité
        const imageData = tempCanvas.toDataURL('image/png', 1.0);
        resolve(imageData);
      } catch (error) {
        reject(error);
      }
    });
  };

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    
    // En-tête
    pdf.setFontSize(22);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Rapport des Graphiques Budgétaires', pageWidth / 2, margin, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('École - Gestion Financière', pageWidth / 2, margin + 8, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, margin + 16, { align: 'center' });
    
    let currentY = margin + 25;
    
    try {
      // Graphique 1: Répartition par catégorie
      if (pieRef.current && statistiques.depensesParCategorie?.length > 0) {
        const canvas = pieRef.current.getCanvas();
        if (canvas) {
          const image = await captureCanvasAsImage(canvas);
          
          pdf.setFontSize(16);
          pdf.setTextColor(40, 40, 40);
          pdf.text('Répartition des Dépenses par Catégorie', pageWidth / 2, currentY, { align: 'center' });
          currentY += 8;
          
          // Taille optimisée pour le PDF
          const imgWidth = pageWidth - (2 * margin);
          const imgHeight = 70;
          
          pdf.addImage(image, 'PNG', margin, currentY, imgWidth, imgHeight, '', 'FAST');
          currentY += imgHeight + 15;
        }
      }
      
      // Nouvelle page si nécessaire
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = margin;
      }
      
      // Graphique 2: Évolution par mois
      if (ligneRef.current && statistiques.depensesParMois?.length > 0) {
        const canvas = ligneRef.current.getCanvas();
        if (canvas) {
          const image = await captureCanvasAsImage(canvas);
          
          pdf.setFontSize(16);
          pdf.text('Évolution des Dépenses par Mois', pageWidth / 2, currentY, { align: 'center' });
          currentY += 8;
          
          const imgWidth = pageWidth - (2 * margin);
          const imgHeight = 70;
          
          pdf.addImage(image, 'PNG', margin, currentY, imgWidth, imgHeight, '', 'FAST');
          currentY += imgHeight + 15;
        }
      }
      
      // Nouvelle page si nécessaire
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = margin;
      }
      
      // Graphique 3: Budget vs Dépenses
      if (barresRef.current && statistiques.evolutionBudgets?.length > 0) {
        const canvas = barresRef.current.getCanvas();
        if (canvas) {
          const image = await captureCanvasAsImage(canvas);
          
          pdf.setFontSize(16);
          pdf.text('Budget vs Dépenses par Catégorie', pageWidth / 2, currentY, { align: 'center' });
          currentY += 8;
          
          const imgWidth = pageWidth - (2 * margin);
          const imgHeight = 80; // Un peu plus haut pour ce graphique
          
          pdf.addImage(image, 'PNG', margin, currentY, imgWidth, imgHeight, '', 'FAST');
          currentY += imgHeight + 15;
        }
      }
      
      // Pied de page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Document généré automatiquement - Usage interne', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
    
    return pdf;
  };

  const handlePrint = async () => {
    if (disabled || isGenerating) return;
    
    try {
      setIsGenerating(true);
      if (onBeforePrint) onBeforePrint();
      
      // Attendre que les graphiques soient rendus
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Générer le PDF
      const pdf = await generatePDF();
      
      // Ouvrir pour impression
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (!printWindow) {
        // Télécharger directement
        pdf.save(`graphiques_visuels_${new Date().toISOString().split('T')[0]}.pdf`);
        alert('PDF téléchargé. Ouvrez-le pour l\'imprimer.');
      } else {
        // La fenêtre s'ouvre avec le PDF, l'utilisateur peut l'imprimer
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
      
      if (onAfterPrint) onAfterPrint();
      
    } catch (error: any) {
      console.error('Erreur impression graphiques:', error);
      alert(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={handlePrint}
        disabled={disabled || isGenerating}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px',
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: isGenerating ? '#94a3b8' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: disabled || isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          opacity: (disabled || isGenerating) ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isGenerating) {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isGenerating) {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {isGenerating ? '⏳' : '📈'}
        </span>
        <span>
          {isGenerating ? 'Génération en cours...' : children}
        </span>
      </button>
      
      {/* Canvas cachés pour générer les graphiques */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {statistiques?.depensesParCategorie?.length > 0 && (
          <GraphiquePie 
            data={statistiques.depensesParCategorie} 
            ref={pieRef}
          />
        )}
        
        {statistiques?.depensesParMois?.length > 0 && (
          <GraphiqueLigne 
            data={statistiques.depensesParMois} 
            ref={ligneRef}
          />
        )}
        
        {statistiques?.evolutionBudgets?.length > 0 && (
          <GraphiqueBarres 
            data={statistiques.evolutionBudgets} 
            ref={barresRef}
          />
        )}
      </div>
    </>
  );
};