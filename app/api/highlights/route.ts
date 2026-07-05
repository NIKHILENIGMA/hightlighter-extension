import { NextResponse } from 'next/server';
import { getHighlights, saveHighlight, deleteHighlight, clearAllHighlights } from '@/lib/db';

function corsResponse(data: any, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const highlights = getHighlights();
    return corsResponse(highlights);
  } catch (error: any) {
    return corsResponse({ error: error.message }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, text, url, title, timestamp } = body;
    
    if (!text || !url) {
      return corsResponse({ error: 'Text and URL are required' }, 400);
    }
    
    const highlight = {
      id: id || Date.now().toString(),
      text,
      url,
      title: title || 'Untitled',
      timestamp: timestamp || new Date().toISOString()
    };
    
    saveHighlight(highlight);
    return corsResponse({ success: true, highlight });
  } catch (error: any) {
    return corsResponse({ error: error.message }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const deleted = deleteHighlight(id);
      if (deleted) {
        return corsResponse({ success: true });
      } else {
        return corsResponse({ error: 'Highlight not found' }, 404);
      }
    } else {
      clearAllHighlights();
      return corsResponse({ success: true });
    }
  } catch (error: any) {
    return corsResponse({ error: error.message }, 500);
  }
}
