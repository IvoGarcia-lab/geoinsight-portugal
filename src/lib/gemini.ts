import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface RegionIndicatorData {
  label: string;
  value: number | null;
  unit: string;
  year: number;
}

export interface AnalysisRequest {
  regionName: string;
  nutsCode: string;
  indicators: Record<string, RegionIndicatorData>;
}

function buildPrompt(data: AnalysisRequest): string {
  const indicatorLines = Object.entries(data.indicators)
    .filter(([, v]) => v.value !== null)
    .map(([key, v]) => `- ${v.label}: ${v.value?.toLocaleString('pt-PT')} ${v.unit} (${v.year})`)
    .join('\n');

  return `És um analista geoestatístico especialista em Portugal. Analisa os seguintes dados da região "${data.regionName}" (${data.nutsCode}) e gera um relatório conciso em Português.

DADOS DA REGIÃO:
${indicatorLines}

INSTRUÇÕES:
1. **Resumo Executivo** (2-3 frases): Caracterização geral da região.
2. **Pontos Fortes** (2-3 bullets): Indicadores acima da média ou positivos. Usa emoji ✅.
3. **Pontos Fracos** (2-3 bullets): Indicadores abaixo do esperado ou preocupantes. Usa emoji ⚠️.
4. **Correlações Relevantes**: Identifica possíveis relações entre indicadores (ex: PIB alto + educação alta).
5. **Recomendação**: Uma sugestão de investigação mais aprofundada.

FORMATO: Markdown. Sê direto, usa dados concretos. Não inventes dados — usa apenas os fornecidos.`;
}

/**
 * Analyze a region with Gemini (streaming)
 */
export async function analyzeRegionStream(
  data: AnalysisRequest
): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    // Return a fallback stream with a helpful message
    const fallbackText = generateFallbackAnalysis(data);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackText));
        controller.close();
      },
    });
  }

  const prompt = buildPrompt(data);

  let response;
  try {
    response = await genAI.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });
  } catch (error: any) {
    console.error('Gemini API call failed:', error?.message || error);
    // Fallback if API fails (e.g. 429 Too Many Requests)
    const fallbackText = generateFallbackAnalysis(data);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackText + '\n\n*(Nota: Ocorreu um erro ao aceder à API Gemini. Foram apresentados dados locais em alternativa.)*'));
        controller.close();
      },
    });
  }

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.text || '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (error) {
        console.error('Gemini stream error:', error);
        controller.enqueue(
          encoder.encode('\n\n⚠️ Erro na análise AI. Tente novamente.')
        );
        controller.close();
      }
    },
  });
}

/**
 * Fallback analysis when no API key is configured
 */
function generateFallbackAnalysis(data: AnalysisRequest): string {
  const indicators = Object.entries(data.indicators).filter(
    ([, v]) => v.value !== null
  );

  const sorted = [...indicators].sort(
    (a, b) => (b[1].value ?? 0) - (a[1].value ?? 0)
  );

  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  return `## 📊 Análise — ${data.regionName}

### Resumo Executivo
A região **${data.regionName}** (${data.nutsCode}) apresenta ${indicators.length} indicadores monitorizados. Os dados mais recentes mostram uma região com características diversificadas no contexto nacional.

### Pontos de Destaque
${indicators
  .slice(0, 4)
  .map(
    ([, v]) =>
      `- **${v.label}**: ${v.value?.toLocaleString('pt-PT')} ${v.unit} (${v.year})`
  )
  .join('\n')}

### Observações
${top ? `✅ Destaque principal em **${top[1].label}**: ${top[1].value?.toLocaleString('pt-PT')} ${top[1].unit}` : ''}
${bottom ? `⚠️ Atenção a **${bottom[1].label}**: ${bottom[1].value?.toLocaleString('pt-PT')} ${bottom[1].unit}` : ''}

### 💡 Recomendação
Explore a correlação entre indicadores usando o scatter plot abaixo para identificar padrões regionais.

---
*⚙️ Para análise AI completa, configure a \`GEMINI_API_KEY\` em \`.env.local\`*
*Obtenha grátis em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)*`;
}
