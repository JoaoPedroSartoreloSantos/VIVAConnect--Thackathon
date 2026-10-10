# VIVA+ — Tecnologia que entende você 🌿💙

> Aplicativo de tecnologia assistiva e saúde inclusiva com foco em idosos, pessoas com baixa visão, dificuldades motoras ou de leitura.

---

## 🚀 Como Executar e Publicar no GitHub

### Opção 1: GitHub Pages (Site Estático Online Instantâneo Gratuito)
Este repositório já inclui o arquivo `.github/workflows/deploy.yml` configurado para publicação automática:

1. Suba este código para o seu repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: VIVA+ app"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```
2. No seu repositório no GitHub, acesse **Settings** > **Pages**.
3. Em **Build and deployment > Source**, escolha **GitHub Actions**.
4. O GitHub executará o workflow automaticamente e publicará o site no link:
   `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

---

### Opção 2: Rodar Localmente no seu Computador
1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   cd SEU_REPOSITORIO
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo `.env` com sua chave do Google Gemini (opcional, para recursos avançados de IA como OCR de receita e Leitor Inteligente):
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   PORT=3000
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

---

### Opção 3: Deploy Full-Stack Gratuito (Render, Railway ou Vercel)
Se desejar executar com o servidor backend (`server.ts` com Express e API Gemini no servidor):
- **Render / Railway / Fly.io**:
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Variável de ambiente: `GEMINI_API_KEY`

---

## 📱 Celular & Computador no GitHub (download.exe para Celular)
- **No Computador**: Acesse o link diretamente pelo navegador no GitHub (Chrome, Edge, Firefox, Safari). Funciona de forma 100% completa, com atalhos acessíveis, leitor de áudio, alto contraste e câmera, sem necessidade de baixar arquivos adicionais ou instalar atalhos.
- **No Celular (Android e iOS)**: Pode ser baixado diretamente pelo botão **"Baixar download.exe"** (arquivo executável exclusivo para dispositivos móveis) ou utilizado no navegador do celular (Chrome/Safari) com suporte offline e voz.

---

## 🌟 Recursos Principais
- **Enxergue, Entenda, Decida, Viva**: Interface com letras ajustáveis (A- / A+), alto contraste (WCAG AAA), botões grandes e áudio com leitor de tela integrado.
- **Minha Saúde**: Registro de pressão arterial e glicemia com aparelhos próprios, histórico, cadastro de medicamentos e resumo médico para consulta.
- **Ler e Ouvir**: Leitor de bulas e receitas assistido por câmera e áudio.
- **Ajuda Perto**: Busca de UPAs, UBSs e farmácias próximas.
- **SOS Real**: Acionamento direto do SAMU 192 e chamada para contato de confiança.
- **Alinhamento aos ODS**: ODS 3 (Saúde e Bem-Estar - Meta 3.8) e ODS 10 (Redução das Desigualdades - Meta 10.2).
