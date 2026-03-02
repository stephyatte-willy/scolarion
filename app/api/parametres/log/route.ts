import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    console.log('📥 API Logs appelée');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dateDebut = searchParams.get('date_debut');
    const dateFin = searchParams.get('date_fin');
    
    console.log('🔍 Paramètres:', { type, dateDebut, dateFin });
    
    // Vérifier d'abord si la table existe
    try {
      const tableCheck = await query("SHOW TABLES LIKE 'logs_activite'");
      console.log('📊 Vérification table:', tableCheck);
      
      // Si la table n'existe pas, retourner un tableau vide
      if (!tableCheck || (Array.isArray(tableCheck) && tableCheck.length === 0)) {
        console.log('ℹ️ Table logs_activite inexistante');
        return NextResponse.json({ 
          success: true, 
          logs: [],
          message: 'Table des logs non créée'
        });
      }
    } catch (tableError) {
      console.log('⚠️ Erreur vérification table:', tableError);
      // On continue quand même, la requête principale échouera
    }
    
    // Construire la requête SQL
    let sql = `
      SELECT 
        l.id,
        l.user_id,
        l.action,
        l.details,
        l.ip_address,
        DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        COALESCE(u.nom, 'Système') as user_nom,
        COALESCE(u.prenom, '') as user_prenom
      FROM logs_activite l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (type && type !== 'tout') {
      sql += ' AND l.action = ?';
      params.push(type);
    }
    
    if (dateDebut) {
      sql += ' AND DATE(l.created_at) >= ?';
      params.push(dateDebut);
    }
    
    if (dateFin) {
      sql += ' AND DATE(l.created_at) <= ?';
      params.push(dateFin);
    }
    
    sql += ' ORDER BY l.created_at DESC LIMIT 500';
    
    console.log('📝 SQL:', sql);
    console.log('🔧 Params:', params);
    
    let logs = [];
    try {
      logs = await query(sql, params) as any[];
      console.log(`✅ ${logs.length} logs récupérés`);
    } catch (queryError: any) {
      console.error('❌ Erreur requête SQL:', queryError.message);
      
      // Si la table n'existe pas, on retourne un tableau vide
      if (queryError.message.includes("Table 'ecole_db.logs_activite' doesn't exist")) {
        console.log('ℹ️ La table logs_activite n\'existe pas encore');
        return NextResponse.json({ 
          success: true, 
          logs: [],
          message: 'Table des logs à créer'
        });
      }
      
      // Autre erreur SQL
      throw queryError;
    }
    
    // S'assurer que logs est un tableau
    if (!Array.isArray(logs)) {
      logs = [];
    }
    
    return NextResponse.json({ 
      success: true, 
      logs: logs,
      count: logs.length
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET logs:', error);
    
    // En cas d'erreur, retourner un tableau vide avec un message
    return NextResponse.json({ 
      success: false, 
      logs: [],
      erreur: error.message || 'Erreur lors de la récupération des logs'
    });
  }
}