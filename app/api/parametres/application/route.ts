import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    const sql = 'SELECT * FROM parametres_application WHERE id = 1';
    const rows = await query(sql) as any[];
    
    const parametres = rows && rows.length > 0 ? rows[0] : {
      devise: 'XOF',
      symbole_devise: 'F CFA',
      format_date: 'dd/mm/yyyy',
      fuseau_horaire: 'Africa/Abidjan',
      langue_defaut: 'fr',
      theme_defaut: 'clair'
    };
    
    return NextResponse.json({ success: true, parametres });
  } catch (error) {
    console.error('Erreur GET parametres app:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    await query(
      `UPDATE parametres_application SET 
        devise = ?, symbole_devise = ?, format_date = ?,
        fuseau_horaire = ?, langue_defaut = ?, theme_defaut = ?,
        updated_at = NOW()
      WHERE id = 1`,
      [data.devise, data.symbole_devise, data.format_date,
       data.fuseau_horaire, data.langue_defaut, data.theme_defaut]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PUT parametres app:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}