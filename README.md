<h1 align="center">Oráculo Celeste — pré-visualização local</h1>

Uma landing de astrologia com cálculo de mapa natal, revolução solar, trânsitos e renderização do gráfico em SVG. Siga os passos abaixo para ver a interface completa rodando no seu ambiente.

## 🚀 Prévia local

1. Instale as dependências (somente na primeira vez):
   ```bash
   npm install
   ```
2. Suba o servidor Express que já serve a API e os arquivos estáticos:
   ```bash
   npm start
   ```
3. Abra [http://localhost:3000](http://localhost:3000) no navegador para usar o formulário, gerar o mapa e baixar gráfico ou PDF.

> Dica: o formulário já vem com valores de demonstração. Basta clicar em **Gerar mapa** para conferir a interface sem preencher nada.

## 🧩 Tecnologias
- Node + Express servindo API e front-end
- Astronomy Engine para cálculos planetários e casas
- Luxon e tz-lookup para fuso horário
- HTML, CSS e JavaScript puros para a interface

## 📝 Licença

MIT