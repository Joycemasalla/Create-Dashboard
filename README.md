# Dashboard Dinâmico de Planilhas

Este é um projeto de dashboard interativo e dinâmico que permite visualizar dados de planilhas Excel (`.xlsx`, `.xls`) e CSV (`.csv`) de forma rápida e intuitiva. A aplicação analisa automaticamente as colunas da sua planilha e gera KPIs (indicadores de performance) e gráficos relevantes, sem a necessidade de pré-configuração de nomes de colunas ou tipos de gráficos.

## Funcionalidades

* **Upload Flexível:** Suporta o upload de arquivos `.xlsx`, `.xls` e `.csv`.
* **Detecção Automática de Dados:** Identifica colunas numéricas, de data e categóricas.
* **KPIs Dinâmicos:** Gera automaticamente KPIs de "Total" e "Média" para todas as colunas numéricas.
* **Gráficos Sugeridos:**
    * Gráficos de linha para visualização de tendências (colunas de data vs. numéricas).
    * Gráficos de barra ou pizza para comparação (colunas categóricas vs. numéricas).
* **Filtros Interativos:** Cria filtros dinâmicos na barra lateral com base nas colunas categóricas e de data, permitindo refinar os dados exibidos.
* **Interatividade nos Gráficos:** Clique em barras, fatias de pizza ou pontos de linha para aplicar ou remover filtros, tornando a análise mais exploratória.
* **Temas Claro e Escuro:** Alterne entre um tema claro e um tema escuro com um clique, com cores otimizadas para contraste e legibilidade.
* **Paleta de Cores Profissional:** Os gráficos utilizam uma paleta de cores consistente e visualmente agradável, adaptada para ambos os temas.
* **Gerenciamento de Planilhas:** Carregue múltiplas planilhas e alterne facilmente entre elas na interface.
* **Alerta de Dados de Exemplo:** Um banner informa o usuário que os dados iniciais são de exemplo, garantindo clareza.

## Como Rodar o Projeto

Este projeto consiste em um backend Node.js (Express) e um frontend simples em HTML, CSS e JavaScript puro.

### Pré-requisitos

* Node.js (versão 14 ou superior recomendada)
* npm (gerenciador de pacotes do Node.js)

### Instalação e Execução

1.  **Clone o repositório (ou faça o download dos arquivos):**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO> # Substitua pela URL do seu repositório
    cd <nome-da-pasta-do-projeto>
    ```
2.  **Instale as dependências do backend:**
    ```bash
    npm install
    ```
3.  **Inicie o servidor backend:**
    ```bash
    node server.js
    ```
    O servidor estará rodando em `http://localhost:3000`.

4.  **Abra o Frontend:**
    * Navegue até a pasta do projeto no seu explorador de arquivos.
    * Abra o arquivo `index.html` diretamente no seu navegador.
    * Alternativamente, você pode usar uma extensão de servidor local no navegador (como "Live Server" para VS Code) para abrir o `index.html`.

## Estrutura do Código

* `index.html`: A estrutura principal do frontend. Contém os containers básicos para o dashboard e a seção de upload, que são preenchidos dinamicamente pelo JavaScript.
* `style.css`: Define todo o estilo visual da aplicação, incluindo os temas claro/escuro e as animações. Utiliza variáveis CSS para fácil personalização.
* `script.js`: O cérebro do frontend.
    * Lida com o upload e o processamento inicial dos dados no lado do cliente.
    * Detecta automaticamente os tipos de dados das colunas (numérica, data, categórica).
    * Gera dinamicamente os KPIs e as configurações dos gráficos com base nos dados analisados.
    * Gerencia os filtros interativos e a atualização do dashboard.
    * Controla a alternância de temas e o gerenciamento de múltiplas planilhas.
    * Utiliza a biblioteca Chart.js para a renderização dos gráficos.
* `server.js`: O backend Node.js.
    * Recebe o arquivo de planilha via requisição HTTP POST.
    * Utiliza a biblioteca `xlsx` para ler e parsear arquivos Excel (`.xlsx`, `.xls`) e CSV (`.csv`).
    * Retorna os dados processados em formato JSON para o frontend.
* `package.json`: Lista as dependências do projeto (Express, Multer, xlsx).

## Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
* **Gráficos:** [Chart.js](https://www.chartjs.org/)
* **Processamento de Planilhas:** [SheetJS (xlsx)](https://sheetjs.com/)
* **Backend:** Node.js, Express.js

## Contribuições e Melhorias Futuras

Sinta-se à vontade para explorar o código, sugerir melhorias ou adicionar novas funcionalidades! Algumas ideias para o futuro incluem:

* Opção de escolher colunas específicas para KPIs e gráficos via interface.
* Mais tipos de gráficos (ex: dispersão, área).
* Download do dashboard como imagem ou PDF.
* Integração com fontes de dados em nuvem.

---