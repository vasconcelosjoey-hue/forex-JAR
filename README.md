<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Gyjg-DW6DkbgijAtzWr1UEGRCjDKVmra

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Deploy automático (GitHub + Vercel)

Este repositório agora possui workflow em `.github/workflows/vercel-deploy.yml` para deploy automático.

### Como configurar (uma vez)

1. Conecte o projeto na Vercel.
2. No GitHub, abra **Settings → Secrets and variables → Actions** e crie os secrets:
   - `VERCEL_TOKEN` (token da Vercel, normalmente começa com `vcp_`)
   - `VERCEL_ORG_ID` (ID real da organização/time, ex.: `team_...`)
   - `VERCEL_PROJECT_ID` (ID real do projeto, ex.: `prj_...`)
3. Faça push para `main` (ou `master`) para deploy de produção automático.
4. Pull requests geram deploy de preview automático.
5. Se o projeto estiver sem `package-lock.json`, o workflow instala dependências com `npm install` automaticamente.

> Dica: `ORG_ID` e `PROJECT_ID` podem ser obtidos com `vercel link` (arquivo `.vercel/project.json`).

### Re-executar workflow no GitHub Actions

Se abrir o modal **Re-run all jobs** no GitHub Actions:

- Clique em **Re-run jobs** normalmente.
- Deixe **Enable debug logging** desmarcado na maioria dos casos.
- Marque **Enable debug logging** apenas quando precisar investigar um erro de pipeline com logs mais detalhados.

### Onde clicar no GitHub

1. Abra **Pull requests** e clique em **Exibir PR**.
2. Dentro da PR, abra a aba **Actions**.
3. Clique no run com erro e depois em **Re-run jobs**.
4. Deixe **Enable debug logging** desmarcado (marque só para investigação).
