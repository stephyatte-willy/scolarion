'use client';

import { useState, useEffect } from 'react';

export default function DiagnosticLogo() {
  const [cheminsTestes, setCheminsTestes] = useState<{chemin: string, existe: boolean}[]>([]);

  useEffect(() => {
    testerCheminsLogo();
  }, []);

  const testerCheminsLogo = async () => {
    const chemins = [
      '/logo_scolarion.png',
      '/logo_scolarion.jpg',
      '/logo_scolarion.jpeg',
      '/logo_scolarion.svg',
      '/logo.png',
      '/logo.jpg',
      '/images/logo_scolarion.png',
      '/assets/logo_scolarion.png',
      './logo_scolarion.png',
      '../logo_scolarion.png',
      '../../logo_scolarion.png',
      '../../../logo_scolarion.png',
      '../../../../logo_scolarion.png'
    ];

    const resultats = await Promise.all(
      chemins.map(async (chemin) => {
        const existe = await verifierImage(chemin);
        return { chemin, existe };
      })
    );

    setCheminsTestes(resultats);
  };

  const verifierImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>🔍 Diagnostic Logo</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Chemins testés :</strong>
      </div>
      {cheminsTestes.map(({ chemin, existe }, index) => (
        <div key={index} style={{ 
          padding: '5px', 
          margin: '2px 0',
          background: existe ? '#d4edda' : '#f8d7da',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          {existe ? '✅' : '❌'} {chemin}
          {existe && (
            <img 
              src={chemin} 
              alt="test" 
              style={{ width: '30px', height: '30px', marginLeft: '10px', verticalAlign: 'middle' }}
            />
          )}
        </div>
      ))}
      <button 
        onClick={testerCheminsLogo}
        style={{ marginTop: '10px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Retester les chemins
      </button>
    </div>
  );
}