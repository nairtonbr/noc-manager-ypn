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
      console.log(`Starting scraping for Client: ${clientId}`);
      
      browser = await (puppeteer as any).launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      // Navigate to ENEL Ceará - Segunda Via (usually the easiest way to see status)
      // Note: This URL might change or require specific navigation
      await page.goto("https://www.enel.com.br/pt-ceara/Para_Voce/segunda_via_de_conta.html", {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      // This is where the complex logic starts:
      // Placeholder logic for CapSolver integration
      const capsolverKey = process.env.CAPSOLVER_API_KEY;

      if (!capsolverKey) {
        await browser.close();
        return res.json({ 
          status: "Manual Action Required", 
          message: "Chave do CapSolver não configurada. Por favor, adicione CAPSOLVER_API_KEY às variáveis de ambiente.",
          details: "A estrutura do scraper está pronta e aguardando a chave."
        });
      }

      // 1. Navigate to ENEL
      await page.goto("https://www.enel.com.br/pt-ceara/Para_Voce/segunda_via_de_conta.html", {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      // 2. Logic to solve CAPTCHA with CapSolver would go here
      // Example: 
      // const { data } = await axios.post('https://api.capsolver.com/createTask', {
      //   clientKey: capsolverKey,
      //   task: { type: 'ReCaptchaV2TaskProxyLess', websiteURL: '...', websiteKey: '...' }
      // });
      
      await browser.close();

      res.json({ 
        status: "Pendente", // Simulating a real return after captcha
        message: "Consulta realizada com sucesso via CapSolver (Simulado)",
      });

    } catch (error: any) {
      console.error("Scraping error:", error);
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
