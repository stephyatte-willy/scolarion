export const verifierImage = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

export const testerCheminsLogo = async () => {
  const chemins = [
    '/logo_scolarion.png',
    '/logo_scolarion.jpg',
    '/logo_scolarion.jpeg',
    '/logo_scolarion.svg',
    '/logo.png',
    '/logo.jpg'
  ];

  for (const chemin of chemins) {
    const existe = await verifierImage(chemin);
    if (existe) {
      console.log(`✅ Logo trouvé: ${chemin}`);
      return chemin;
    }
  }
  
  console.log('❌ Aucun logo trouvé');
  return null;
};