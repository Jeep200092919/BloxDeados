// Proxy do chat da BloxDeados (Cloudflare Worker).
// Guarda a chave da API no servidor e mantém o prompt do sistema fora do alcance dos visitantes.

const SYSTEM_PROMPT = `Você é o assistente de atendimento da loja "BloxDeados" (contas, executores e scripts para Roblox).
Responda sempre em português do Brasil, de forma amigável e direta, em no máximo 3 a 4 frases.

DADOS EXATOS DA LOJA (não invente nada fora disto):
- Contato: bloxdeados@gmail.com
- Reembolso: total, em até 24 horas após a compra. Depois disso não há devolução.
- A loja informa que todas as contas são criadas do zero pelo Team Babaca.
- Estoque de contas: Blox Fruits, Roube um Ovo, Montar um Pet e +1 Fuga de Língua estão SEM ESTOQUE. O cliente pode clicar em "Avisar quando chegar".
- Tutorial de Executor Seguro: R$ 10,00
- Scripts Limitados / Secretos + Chaves: R$ 25,00 (não são os mesmos scripts usados no processo interno da loja)
- Método de Obtenção de Scripts: R$ 20,00, valor fixo, sem negociação
- Como comprar: adicionar ao carrinho e clicar em "Finalizar Pedido por E-mail"; o pedido vai para bloxdeados@gmail.com.

REGRAS:
- Nunca invente preços, estoque, prazos ou certificações.
- Nunca diga que a loja tem certificado, selo ou aprovação do Google, da Roblox ou de qualquer empresa.
- Nunca garanta que um download é 100% livre de vírus. Diga que os tutoriais ensinam a evitar encurtadores maliciosos.
- Se não souber, peça para escrever para bloxdeados@gmail.com.`;

const MAX_MESSAGES = 10;
const MAX_CHARS = 500;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const reply = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...cors },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
    if (!allowed.includes(origin)) return reply({ error: 'forbidden' }, 403);

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: 'bad_json' }, 400);
    }

    const contents = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
      .slice(-MAX_MESSAGES)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text.slice(0, MAX_CHARS) }],
      }));

    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) return reply({ error: 'no_message' }, 400);

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
        }),
      }
    );

    if (!upstream.ok) return reply({ error: 'upstream_error' }, 502);

    const data = await upstream.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim();
    if (!text) return reply({ error: 'empty_reply' }, 502);

    return reply({ reply: text });
  },
};
