import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    const analyses = await db.savedAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(analyses);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      code: error.code 
    }, { status: 500 });
  }
}
