import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get user from session (Supabase Auth)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      primaryIndicator, 
      secondaryIndicator, 
      scaleType, 
      overlayMode, 
      year 
    } = body;

    // Ensure user exists in our DB (upsert)
    await db.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || null
      }
    });

    const analysis = await db.savedAnalysis.create({
      data: {
        title: title || `Análise de ${new Date().toLocaleDateString()}`,
        primaryIndicator,
        secondaryIndicator: secondaryIndicator || null,
        scaleType: scaleType || 'quantile',
        overlayMode: overlayMode || 'none',
        year: year || 2024,
        userId: user.id
      }
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error saving analysis:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      code: error.code // Prisma error codes (e.g. P1001)
    }, { status: 500 });
  }
}
