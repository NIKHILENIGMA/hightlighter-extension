import { NextResponse } from 'next/server';
import { updateHighlight } from '@/lib/db';

function corsResponse(data: any, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, text, apiKey: clientApiKey } = body;
    
    if (!text) {
      return corsResponse({ error: 'Text is required for summarization' }, 400);
    }
    
    const apiKey = process.env.OPENAI_API_KEY || clientApiKey;
    
    if (!apiKey) {
      return corsResponse({ error: 'No OpenAI API Key found. Configure OPENAI_API_KEY in your env or settings.' }, 400);
    }
    
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a concise summaries assistant. Summarize the following text in one or two clear, professional sentences.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 100,
        temperature: 0.5
      })
    });
    
    if (!openAiResponse.ok) {
      const errData = await openAiResponse.json();
      throw new Error(errData.error?.message || `HTTP ${openAiResponse.status}`);
    }
    
    const data = await openAiResponse.json();
    const summary = data.choices[0].message.content.trim();
    
    if (id) {
      updateHighlight(id, { summary });
    }
    
    return corsResponse({ success: true, summary });
  } catch (error: any) {
    return corsResponse({ error: error.message }, 500);
  }
}
