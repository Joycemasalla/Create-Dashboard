# EasyBoard - Dashboard fácil de montar

Este projeto é um dashboard interativo simples e moderno, construído puramente com HTML, CSS e JavaScript (sem frameworks ou backend complexo). Ele permite que você faça upload de suas planilhas (`.csv` ou `.xlsx`) e visualize automaticamente dados-chave em formato de KPIs e gráficos interativos.

O objetivo é fornecer uma ferramenta de análise de dados acessível e visualmente agradável, com uma experiência de usuário profissional inspirada em ferramentas como o Power BI.

## Funcionalidades Implementadas:

* **Upload de Planilhas:** Suporte a arquivos `.csv` e `.xlsx`. A leitura é feita diretamente no navegador (frontend).
* **Geração Automática de Dashboards:** Após o upload, o sistema analisa automaticamente as colunas da planilha e gera:
    * **Indicadores de Desempenho (KPIs):** Total, Média, Máximo e Mínimo para colunas numéricas, com ícones visuais e cores distintas. Eles são clicáveis para indicar interatividade (a lógica de filtro direto depende do contexto do KPI).
    * **Gráficos Dinâmicos:**
        * **Gráficos de Rosca (Doughnut):** Para colunas categóricas com poucas categorias (até 10). A legenda exibe as categorias e suas cores.
        * **Gráficos de Barra:** Para colunas categóricas com mais categorias (até 25). As categorias são exibidas no eixo X e os valores no eixo Y. A legenda é desabilitada para manter a clareza, e os tooltips (ao passar o mouse) fornecem detalhes.
        * **Gráficos de Linha/Área:** Para visualização temporal. A legenda é desabilitada, e o eixo X mostra o tempo, com tooltips para detalhes.
    * **Widgets de Insights:** Frases automáticas geradas com base nos dados (ex: produto mais caro, região com mais vendas), exibidas em cards destacados no dashboard.
* **Filtros de Dados:** Campos de filtro são gerados dinamicamente na barra lateral com base nas colunas da planilha, permitindo filtrar os dados do dashboard em tempo real. Um botão "Limpar Filtros" reseta todas as seleções.
* **Gerenciamento de Planilhas:**
    * As planilhas carregadas são mantidas em um histórico na barra lateral.
    * Uma lista permite alternar facilmente entre as análises de planilhas anteriores.
    * Botão "Nova Planilha" para retornar à tela de upload e iniciar uma nova análise.
* **Temas Claro e Escuro:** Alterne facilmente entre o modo claro e escuro, com transições visuais suaves e ajustes de contraste para garantir a legibilidade em ambos os temas.
* **Design Profissional e Acessível:**
    * Layout limpo com espaçamento aprimorado, sombras suaves e cantos arredondados para todos os cards.
    * Paletas de cores harmoniosas para os gráficos, com tons modernos e agradáveis.
    * Textos mais legíveis nos eixos e legendas dos gráficos (fonte ligeiramente maior, formatação inteligente para valores monetários grandes, truncamento de rótulos longos).
    * Tooltips de ajuda (`ℹ️` ou `❓`) ao lado dos títulos dos gráficos, explicando o propósito de cada visualização.
* **Responsividade:** O layout se adapta a diferentes tamanhos de tela (desktops, tablets, celulares), garantindo uma boa experiência de uso em qualquer dispositivo.

## Como Rodar o Projeto:

Para rodar este projeto localmente, você precisa ter o Node.js e o npm (Node Package Manager) instalados em seu computador.

1.  **Clone ou Baixe o Projeto:**
    Se você estiver usando Git, clone o repositório:
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_AQUI>
    cd <pasta_do_projeto>
    ```
    Ou baixe o arquivo ZIP e extraia para uma pasta.

2.  **Instale as Dependências do Servidor:**
    Navegue até a pasta raiz do projeto (onde o `package.json` está) no seu terminal e instale as dependências:
    ```bash
    npm install
    ```
    Isso instalará pacotes como `express`, `multer` e `cors`, que são usados pelo `server.js`.

3.  **Inicie o Servidor:**
    No mesmo terminal, inicie o servidor Node.js:
    ```bash
    node server.js
    ```
    Você deverá ver a mensagem: `Servidor rodando em http://localhost:3000`.

4.  **Acesse o Dashboard no Navegador:**
    Abra seu navegador (Chrome, Firefox, Edge, etc.) e digite a seguinte URL:
    ```
    http://localhost:3000/index.html
    ```
    **Importante:** Acesse sempre através de `http://localhost:3000/index.html` para evitar problemas de CORS (Cross-Origin Resource Sharing) que podem ocorrer se você tentar abrir o arquivo `index.html` diretamente do seu disco (`file:///`).

## Como Usar o Dashboard:

1.  **Fazer Upload da Planilha:**
    * Na tela inicial, clique em "Escolher arquivo" e selecione sua planilha (`.csv` ou `.xlsx`).
    * Clique no botão "Gerar Dashboard".
2.  **Interagir com o Dashboard:**
    * Os **KPIs** (blocos de totais, médias, máximos, mínimos) exibirão os números-chave. Eles são clicáveis, mas para KPIs agregados (total, média), o clique atualmente exibe um alerta, pois não há um filtro categórico claro para aplicar.
    * Os **Widgets de Insights** mostrarão frases resumidas sobre os dados.
    * Os **gráficos** serão gerados automaticamente.
    * **Tooltips de Ajuda:** Passe o mouse sobre o ícone `ℹ️` ou `❓` ao lado do título de cada gráfico para ver uma breve descrição.
    * **Filtros:** Use os dropdowns na barra lateral esquerda para filtrar os dados por colunas categóricas ou de data. Clique em "Limpar Filtros" para resetar.
    * **Tooltip de Gráfico:** Passe o mouse sobre as barras, fatias ou pontos nos gráficos para ver detalhes e valores.
    * **Cliques em Gráficos:** Clicar em uma barra, fatia ou ponto em um gráfico aplicará um filtro para aquela categoria aos demais gráficos.
    * **Trocar Tema:** Use os botões "☀️ Light" e "🌙 Dark" no cabeçalho para alternar o tema visual.
    * **Gerenciar Planilhas:** Na barra lateral esquerda, abaixo dos filtros:
        * A lista de "Planilhas" mostrará todas as planilhas que você já carregou na sessão. Clique em uma para alternar para a análise dela.
        * Clique em "Nova Planilha" para voltar à tela de upload e carregar um novo arquivo.

---

**Instruções Finais para Você:**

1.  **Crie um novo arquivo** chamado `charts.js` na mesma pasta do seu `index.html`, `style.css` e `script.js`.
2.  **Copie o conteúdo** do **`index.html`** fornecido acima e **substitua** o seu arquivo local.
3.  **Copie o conteúdo** do **`style.css`** fornecido acima e **substitua** o seu arquivo local.
4.  **Copie o conteúdo** do **`script.js`** fornecido acima e **substitua** o seu arquivo local. (Note que este `script.js` está agora mais conciso, com a lógica de gráficos movida).
5.  **Copie o conteúdo** do **`charts.js`** fornecido acima e **cole-o** no novo arquivo `charts.js` que você criou.
6.  **Crie um novo arquivo** chamado `README.txt` (ou renomeie seu `README.md` se preferir) e **copie o conteúdo** fornecido acima para ele.
7.  **Certifique-se de que seu `server.js` tem a linha `app.use(cors());`** para garantir a comunicação correta.
8.  **Reinicie o servidor Node.js** (Ctrl+C para parar, depois `node server.js` para iniciar novamente).
9.  **Acesse seu dashboard via `http://localhost:3000/index.html`** no navegador para ver todas as melhorias em ação.

Seu projeto agora está com uma interface muito mais profissional e amigável, com as funcionalidades aprimoradas que você solicitou. Se tiver mais alguma dúvida ou precisar de ajustes futuros, estou à disposição!