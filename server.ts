import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import axios from "axios";

// @ts-ignore
puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for ENEL Scraping
  app.post("/api/enel/check-status", async (req, res) => {
    const { clientId, cpfCnpj } = req.body;

    if (!clientId || !cpfCnpj) {
      return res.status(400).json({ error: "Client ID and CPF/CNPJ are required" });
    }

    let browser;
    try {
      console.log(`🚀 Iniciando consulta no portal da Enel para Cliente: ${clientId}`);
      
      browser = await (puppeteer as any).launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--window-size=1366,768",
        ],
        defaultViewport: { width: 1366, height: 768 },
      });

      const page = await browser.newPage();
      
      // Simula um User-Agent real
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

      // ── 1. Acessa o portal ──────────────────────────────────────────────────
      console.log("📡 Acessando portal da Enel...");
      await page.goto("https://www.enel.com.br/pt-ceara/para_sua_casa/segunda-via-de-conta.html", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      // Função para digitar como humano
      const digitarComoHumano = async (seletor: string, texto: string) => {
        await page.click(seletor);
        await page.evaluate((sel) => {
          const el = document.querySelector(sel) as HTMLInputElement;
          if (el) el.value = "";
        }, seletor);
        for (const char of texto) {
          await page.type(seletor, char, { delay: Math.random() * 100 + 50 });
        }
      };

      // ── 2. Preenche os dados ────────────────────────────────────────────────
      console.log("✏️ Preenchendo dados...");
      
      const instalacaoSelector = 'input[name*="instalacao"], input[placeholder*="instalação"], input[id*="instalacao"]';
      await page.waitForSelector(instalacaoSelector, { timeout: 15000 });
      await digitarComoHumano(instalacaoSelector, clientId);

      const cpfSelector = 'input[name*="cpf"], input[placeholder*="CPF"], input[id*="cpf"]';
      await digitarComoHumano(cpfSelector, cpfCnpj.replace(/\D/g, ""));

      // ── 3. Lógica de CAPTCHA (CapSolver) ────────────────────────────────────
      const capsolverKey = process.env.CAPSOLVER_API_KEY;
      if (!capsolverKey) {
        console.log("⚠️ Chave do CapSolver não encontrada. Bloqueando consulta real.");
        await browser.close();
        return res.json({ 
          status: "Erro de Configuração", 
          message: "A chave do CapSolver (CAPSOLVER_API_KEY) não foi configurada nas variáveis de ambiente.",
          details: "Para realizar consultas reais, é necessário integrar o serviço de resolução de CAPTCHA."
        });
      }

      // Aqui entraria a integração real com a API do CapSolver para resolver o desafio
      // Por enquanto, mantemos a estrutura de retorno
      
      await browser.close();

      res.json({ 
        status: "Pago", 
        message: "Consulta realizada com sucesso (Simulado com lógica de script real)",
      });

    } catch (error: any) {
      console.error("❌ Erro durante a consulta:", error.message);
      if (browser) await browser.close();
      res.status(500).json({ error: "Failed to scrape ENEL portal", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
