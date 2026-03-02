// utils/formatTime.ts
export function formatTimeToHHMM(timeString: string): string {
  if (!timeString) return '08:00';
  
  // Si déjà au format HH:MM
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
    return timeString;
  }
  
  // Si au format HH:MM:SS
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  
  // Si c'est un objet Date ou autre format
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (e) {
    // Continuer avec le parsing manuel
  }
  
  // Parsing manuel
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0]) || 8;
    const minutes = parseInt(parts[1]) || 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Valeur par défaut
  return '08:00';
}