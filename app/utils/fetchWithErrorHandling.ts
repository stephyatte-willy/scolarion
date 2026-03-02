// utils/fetchWithErrorHandling.ts
export async function fetchWithErrorHandling(
  url: string, 
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`📡 ${options.method || 'GET'} ${url} - Status: ${response.status}`);
    
    // Vérifier si la réponse est vide
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || !response.body) {
      console.error('❌ Réponse vide de', url);
      throw new Error('Réponse vide du serveur');
    }
    
    // Lire le texte
    const text = await response.text();
    
    // Vérifier si c'est du JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError, 'Texte:', text.substring(0, 200));
        throw new Error('Réponse JSON invalide');
      }
    } else {
      // Si ce n'est pas du JSON, vérifier si c'est une erreur
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }
      // Retourner le texte brut si ce n'est pas une erreur
      return { success: true, data: text };
    }
    
  } catch (error: any) {
    console.error(`❌ Erreur fetch ${url}:`, error);
    
    // Re-lancer l'erreur avec plus d'informations
    throw new Error(`Erreur lors de la requête à ${url}: ${error.message}`);
  }
}