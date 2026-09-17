import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Inicialização segura do cliente Gemini SDK no backend
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Endpoint de integridade
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Endpoint de Assistência e Coach IA
  app.post("/api/gemini/assist", async (req, res) => {
    try {
      const { prompt, context, history } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: "GEMINI_API_KEY não configurada no servidor. Configure a chave no menu Secrets do Google AI Studio."
        });
        return;
      }

      // Contextualização rica baseada nos dados fisiológicos do usuário
      const systemInstruction = `Você é o Coach IA e Fisiologista do Exercício integrado ao aplicativo Treino & Saúde.
Sua missão é facilitar ao máximo a vida do atleta, ajudá-lo a fazer adaptações inteligentes no treino e ajudá-lo a entender exatamente o que está sentindo e o que está fazendo.

Áreas de conhecimento fundamentais:
- Fisiologia do Exercício e Carga Interna (Método de Foster: PSE × Duração).
- Monitoramento de Carga Aguda:Crônica (ACWR de Tim Gabbett):
  * < 0.8: Carga baixa (risco de destreinamento ou subcarga).
  * 0.8 a 1.3: "Sweet Spot" / Zona Ótima (máximo ganho atlético, mínimo risco).
  * 1.3 a 1.49: Zona de Atenção (fadiga acumulando).
  * >= 1.5: Zona de Risco Alto ("Danger Zone", spike perigoso de carga).
- Escala de Recuperação Total (TQR de Kenttä & Hassmén, 6 a 20):
  * 6 a 10: Recuperação péssima/muito fraca.
  * 11 a 13: Recuperação razoável/moderada.
  * 14 a 17: Boa recuperação.
  * 18 a 20: Excelente recuperação.
- Escala de Esforço Percebido (Borg CR-10 / PSE 0-10) e Repetições em Reserva (RIR):
  * RIR 0: Falha concêntrica.
  * RIR 1-3: Zona ideal de hipertrofia efetiva.
- Escala Visual Analógica de Dor (VAS 0-10):
  * 0: Sem dor.
  * 1-3: Desconforto leve / dor muscular tardia suportável.
  * 4-6: Dor moderada (requer modificação biomecânica ou redução de amplitude/carga).
  * 7-10: Dor aguda severa (interrupção imediata do movimento).

Diretrizes de Resposta:
1. Responda em Português do Brasil de forma acolhedora, objetiva, científica e prática.
2. Seja direto e estruturado com listas ou tópicos curtos para leitura rápida no celular (Poco X5).
3. Adaptações práticas: se o usuário disser que está sentindo dor, cansaço ou sem tempo, dê alternativas biomecânicas exatas (ex: trocar supino reto com barra por halteres com pegada neutra ou máquina articulada; reduzir de 4 para 2 séries efetivas com RIR 2; protocolo de aquecimento direcionado).
4. Explicação do que está sentindo: diferencie dor muscular tardia (DOMS) de dor articular/tendínea; explique o impacto do sono ruim (TQR baixo) na coordenação motora e risco de lesão.
5. Sempre faça conexões com os dados do usuário fornecidos no contexto (se houver séries de hoje, ACWR ou TQR).`;

      // Formatar histórico se fornecido
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Injetar contexto no primeiro prompt do usuário
      let promptComContexto = prompt;
      if (context && typeof context === 'object') {
        const ctxStr = JSON.stringify(context, null, 2);
        promptComContexto = `[DADOS E CONTEXTO ATUAL DO ATLETA]:\n${ctxStr}\n\n[MENSAGEM / DÚVIDA DO ATLETA]:\n${prompt}`;
      }

      if (Array.isArray(history) && history.length > 0) {
        for (const h of history) {
          if (h.role === 'user' || h.role === 'model') {
            formattedContents.push({
              role: h.role,
              parts: [{ text: String(h.text || '') }]
            });
          }
        }
      }

      // Adicionar a pergunta atual
      formattedContents.push({
        role: 'user',
        parts: [{ text: promptComContexto }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const respostaTexto = response.text || "Desculpe, não consegui processar a resposta no momento.";
      res.json({ text: respostaTexto });
    } catch (error: any) {
      console.error("Erro na API Gemini Coach:", error);
      res.status(500).json({
        error: error?.message || "Ocorreu um erro ao comunicar com a inteligência artificial."
      });
    }
  });

  // Vite middleware no modo desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Treino & Saúde rodando em http://localhost:${PORT}`);
  });
}

startServer();
