// API OpenRouter configuration

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

FORMATO:
1. Começa com o texto em Markdown (Resumo, Pontos Fortes, Pontos Fracos, Correlações, Recomendação).
2. OBRIGATÓRIO: No final do relatório, insere um bloco JSON com a seguinte estrutura exata:
\`\`\`json
{
  "mapActions": [
    { "action": "setOverlayMode", "value": "bivariate" },
    { "action": "setPrimaryIndicator", "value": "ID_DO_INDICADOR_1" },
    { "action": "setSecondaryIndicator", "value": "ID_DO_INDICADOR_2" }
  ],
  "chartData": {
    "type": "scatter",
    "xAxis": "ID_DO_INDICADOR_1",
    "yAxis": "ID_DO_INDICADOR_2"
  }
}
\`\`\`
Substitui "ID_DO_INDICADOR_X" pelos IDs reais dos indicadores fornecidos (ex: "demo_r_pjanaggr3", "nama_10r_3gdp"). As ações de mapa são exemplos, escolhe a correlação mais forte que encontrares. Usa apenas os dados fornecidos.`;
}

/**
 * Analyze a region with Gemini (streaming)
 */
export async function analyzeRegionStream(
  data: AnalysisRequest
): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_api_key_here') {
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
  const encoder = new TextEncoder();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://geoinsight.local',
        'X-OpenRouter-Title': 'GeoInsight',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            
            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const text = data.choices[0]?.delta?.content || '';
                  if (text) controller.enqueue(encoder.encode(text));
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('OpenRouter stream error:', error);
          controller.enqueue(
            encoder.encode('\n\n⚠️ Erro na análise AI. Tente novamente.')
          );
          controller.close();
        }
      },
    });
  } catch (error: any) {
    console.error('OpenRouter API call failed:', error?.message || error);
    const fallbackText = generateFallbackAnalysis(data);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackText + '\n\n*(Nota: Ocorreu um erro ao aceder à API OpenRouter. Foram apresentados dados locais em alternativa.)*'));
        controller.close();
      },
    });
  }
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
*⚙️ Para análise AI completa, configure a \`OPENROUTER_API_KEY\` em \`.env.local\`*
*Obtenha grátis em [openrouter.ai](https://openrouter.ai)*`;
}
