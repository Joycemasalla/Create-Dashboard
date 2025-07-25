// Variáveis globais para os elementos do DOM e dados
let rawData = []; // Dados da planilha atualmente ATIVA
let uploadedSheets = []; // Array de todas as planilhas carregadas: [{ name: "nome.xlsx", data: [...] }, ...]
let currentActiveSheetIndex = -1; // Índice da planilha atualmente visível
const filters = {}; // Objeto para armazenar os filtros ativos
let allChartsInstances = {}; // Armazenará as instâncias dos gráficos Chart.js para destruição/recriação

// Referências aos elementos do DOM (serão inicializadas em DOMContentLoaded)
let uploadSection;
let dashboardContainer;
let dashboardTitle;
let sidebarFilterArea;
let kpiAreaMain;
let kpiQuantidade;
let themeLightButton;
let themeDarkButton;
let currentDateSpan;
let loggedUserSpan;
let uploadButton;
let fileInput;
let chartGridContainer; // Container pai para os gráficos dinâmicos
let uploadedSheetsArea; // Nova área para listar planilhas carregadas
let uploadedSheetsList; // Lista <ul> dentro da área de planilhas
let newSheetButton; // Botão para adicionar nova planilha
let exampleDataAlert; // Banner de alerta de dados de exemplo


document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa as referências dos elementos do DOM
    uploadSection = document.querySelector('.upload-section');
    dashboardContainer = document.getElementById('dashboard-container');
    dashboardTitle = document.getElementById('dashboard-title');
    sidebarFilterArea = document.getElementById('sidebar-filter-area');
    kpiAreaMain = document.getElementById('kpi-area-main');
    kpiQuantidade = document.getElementById('kpi-quantidade');
    chartGridContainer = document.getElementById('chart-grid-container');
    themeLightButton = document.getElementById('theme-light-button');
    themeDarkButton = document.getElementById('theme-dark-button');
    currentDateSpan = document.getElementById('current-date');
    loggedUserSpan = document.getElementById('logged-user');
    uploadButton = document.getElementById('upload-button');
    fileInput = document.getElementById('file-input');
    uploadedSheetsArea = document.getElementById('uploaded-sheets-area');
    uploadedSheetsList = document.getElementById('uploaded-sheets-list');
    newSheetButton = document.getElementById('new-sheet-button');
    exampleDataAlert = document.getElementById('example-data-alert');

    // **Verificação de segurança:** Confirma que todos os elementos essenciais foram encontrados
    const requiredElements = [
        uploadSection, dashboardContainer, dashboardTitle, sidebarFilterArea,
        kpiAreaMain, kpiQuantidade, chartGridContainer,
        themeLightButton, themeDarkButton, currentDateSpan,
        loggedUserSpan, uploadButton, fileInput, uploadedSheetsArea,
        uploadedSheetsList, newSheetButton, exampleDataAlert
    ];
    const missingElements = requiredElements.filter(el => el === null);
    if (missingElements.length > 0) {
        console.error("ERRO CRÍTICO: Elementos HTML essenciais não encontrados. Verifique IDs e estrutura HTML.", missingElements);
        alert("Erro na inicialização da página. Abra o console do navegador para detalhes e encontre o elemento 'null'.");
        return;
    }


    // 2. Adiciona Event Listeners
    uploadButton.addEventListener('click', handleUpload);
    newSheetButton.addEventListener('click', () => {
        // Limpa o input de arquivo para permitir o upload do mesmo arquivo novamente, se desejado
        fileInput.value = '';
        uploadSection.style.display = 'flex'; // Exibe a seção de upload
        dashboardContainer.style.display = 'none'; // Oculta o dashboard
        dashboardTitle.textContent = 'Crie seu Dashboard'; // Reseta o título
        exampleDataAlert.style.display = 'block'; // Mostra o alerta de dados de exemplo
    });
    themeLightButton.addEventListener('click', () => setTheme('light'));
    themeDarkButton.addEventListener('click', () => setTheme('dark'));

    // 3. Define o estado inicial da UI
    uploadSection.style.display = 'flex'; // Garante que a seção de upload esteja visível ao iniciar
    dashboardContainer.style.display = 'none';
    exampleDataAlert.style.display = 'block'; // Alerta de dados de exemplo visível por padrão

    // 4. Carrega o tema salvo e exibe data/usuário
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    const today = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    currentDateSpan.textContent = today.toLocaleDateString('pt-BR', options);
});


// Função principal para lidar com o upload da planilha
async function handleUpload() {
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione uma planilha para enviar.');
        return;
    }

    // Oculta a seção de upload e mostra o dashboard
    uploadSection.style.display = 'none';
    dashboardContainer.style.display = 'grid';
    dashboardTitle.textContent = 'Analisando dados...';
    exampleDataAlert.style.display = 'none'; // Oculta o alerta de dados de exemplo após o upload

    // Limpa filtros e reseta dados brutos para a nova planilha
    for (const key in filters) {
        delete filters[key];
    }
    rawData = []; 

    // Prepara os dados para envio ao servidor
    const formData = new FormData();
    formData.append('spreadsheet', file);

    try {
        const response = await fetch('http://localhost:3000/api/analyze-data', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro na comunicação com o servidor.');
        }

        const result = await response.json();

        if (result.success) {
            dashboardTitle.textContent = 'Dashboard Gerado!';
            const newSheetData = {
                name: file.name,
                data: result.data
            };
            uploadedSheets.push(newSheetData); // Adiciona a nova planilha ao array de planilhas carregadas
            currentActiveSheetIndex = uploadedSheets.length - 1; // Define a nova planilha como ativa
            rawData = newSheetData.data; // Atualiza rawData para a planilha ativa

            console.log('Cabeçalhos da Planilha:', Object.keys(rawData[0] || {})); // Log dos cabeçalhos para depuração

            if (rawData.length > 0) {
                buildDashboard(rawData); // Constrói o dashboard com os dados da nova planilha
                buildFilterUI(rawData); // Constrói a UI de filtros
                updateUploadedSheetsUI(); // Atualiza a lista de planilhas carregadas na UI
                uploadedSheetsArea.style.display = 'block'; // Exibe a área de planilhas carregadas
            } else {
                dashboardTitle.textContent = 'Atenção';
                uploadSection.style.display = 'flex';
                dashboardContainer.style.display = 'none';
                alert('A planilha está vazia ou não contém dados válidos.');
                // Remove a planilha vazia da lista
                uploadedSheets.pop();
                currentActiveSheetIndex = uploadedSheets.length > 0 ? uploadedSheets.length -1 : -1;
                updateUploadedSheetsUI();
            }
        } else {
            dashboardTitle.textContent = 'Erro ao gerar o dashboard';
            uploadSection.style.display = 'flex';
            dashboardContainer.style.display = 'none';
            alert(`Erro do servidor: ${result.error}`);
        }
    }
    // Tratamento de erros de rede ou servidor
    catch (error) {
        console.error('Erro:', error);
        dashboardTitle.textContent = 'Erro ao gerar o dashboard';
        uploadSection.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        alert(`Ocorreu um erro: ${error.message}. Por favor, verifique se o servidor está rodando (npm start) e tente novamente.`);
    }
}

// Atualiza a lista de planilhas carregadas na sidebar do upload
function updateUploadedSheetsUI() {
    uploadedSheetsList.innerHTML = ''; // Limpa a lista existente
    if (uploadedSheets.length === 0) {
        uploadedSheetsArea.style.display = 'none';
        return;
    }

    uploadedSheetsArea.style.display = 'block';
    uploadedSheets.forEach((sheet, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = sheet.name;
        if (index === currentActiveSheetIndex) {
            listItem.classList.add('active-sheet');
        }
        listItem.dataset.index = index; // Armazena o índice para fácil acesso

        // Botão de remover planilha
        const removeButton = document.createElement('button');
        removeButton.classList.add('sheet-remove-btn');
        removeButton.innerHTML = '&#x2715;'; // X mark
        removeButton.title = `Remover ${sheet.name}`;
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique no botão ative a seleção da planilha
            removeSheet(index);
        });

        listItem.appendChild(removeButton);

        listItem.addEventListener('click', () => loadSheet(index));
        uploadedSheetsList.appendChild(listItem);
    });
}

// Carrega uma planilha anterior para visualização
function loadSheet(index) {
    if (index === currentActiveSheetIndex) return; // Já é a planilha ativa

    currentActiveSheetIndex = index;
    rawData = uploadedSheets[index].data;
    
    // Limpa e reaplica filtros para a nova planilha ativa
    for (const key in filters) {
        delete filters[key];
    }
    
    dashboardTitle.textContent = `Dashboard: ${uploadedSheets[index].name}`;
    buildDashboard(rawData);
    buildFilterUI(rawData);
    updateUploadedSheetsUI(); // Atualiza o destaque na lista
    dashboardContainer.style.display = 'grid'; // Garante que o dashboard esteja visível
    uploadSection.style.display = 'none'; // Oculta a seção de upload
}

// Remove uma planilha da lista
function removeSheet(indexToRemove) {
    // Se a planilha removida for a ativa
    if (indexToRemove === currentActiveSheetIndex) {
        // Redefine rawData e oculta o dashboard
        rawData = [];
        dashboardContainer.style.display = 'none';
        uploadSection.style.display = 'flex';
        dashboardTitle.textContent = 'Crie seu Dashboard';
        exampleDataAlert.style.display = 'block'; // Mostra o alerta novamente
        for (const key in filters) {
            delete filters[key];
        }
        // Limpa os containers visuais
        kpiAreaMain.innerHTML = '';
        kpiQuantidade.innerHTML = '';
        chartGridContainer.innerHTML = '';
        sidebarFilterArea.innerHTML = '';
        for (const chartId in allChartsInstances) {
            if (allChartsInstances[chartId]) {
                allChartsInstances[chartId].destroy();
            }
        }
        allChartsInstances = {};
    }

    uploadedSheets.splice(indexToRemove, 1); // Remove a planilha do array

    // Ajusta o índice da planilha ativa se necessário
    if (currentActiveSheetIndex > indexToRemove) {
        currentActiveSheetIndex--;
    } else if (currentActiveSheetIndex === indexToRemove && uploadedSheets.length > 0) {
        // Se removeu a última e ainda há planilhas, ativa a nova última
        currentActiveSheetIndex = uploadedSheets.length - 1;
        loadSheet(currentActiveSheetIndex);
    } else if (uploadedSheets.length === 0) {
        currentActiveSheetIndex = -1; // Nenhuma planilha restante
        // Se não há mais planilhas, garante que a área de upload seja exibida
        uploadSection.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        dashboardTitle.textContent = 'Crie seu Dashboard';
        exampleDataAlert.style.display = 'block';
    }

    updateUploadedSheetsUI(); // Atualiza a lista na UI
}


// Função principal para construir e renderizar o dashboard
function buildDashboard(data) {
    // Limpa todas as instâncias de gráficos Chart.js existentes
    for (const chartId in allChartsInstances) {
        if (allChartsInstances[chartId]) {
            allChartsInstances[chartId].destroy();
        }
    }
    allChartsInstances = {}; // Reseta o objeto de instâncias de gráficos


    // Limpa os containers de KPI e gráficos
    kpiAreaMain.innerHTML = '';
    kpiAreaMain.style.display = 'grid'; // Garante que a área de KPI esteja visível
    kpiQuantidade.innerHTML = '';
    kpiQuantidade.style.display = 'none'; // O KPI grande será reativado se houver um gerado.
    chartGridContainer.innerHTML = '';


    const {
        allCharts,
        allKpis,
        columnTypes
    } = analyzeAndCreateDashboardItems(data);

    // --- Renderiza KPIs ---
    if (allKpis.length > 0) {
        // Tenta encontrar um KPI 'Total' para ser o principal (grande)
        // Por exemplo, o primeiro KPI de total de uma coluna numérica
        const mainKpi = allKpis.find(kpi => kpi.type === 'total' && kpi.totalValue !== undefined);
        
        if (mainKpi) {
            kpiQuantidade.style.display = 'flex'; // Exibe o container do KPI grande
            kpiQuantidade.innerHTML = `
                <h4>${mainKpi.title}</h4>
                <p style="color:${mainKpi.color || 'var(--success-color)'};">${mainKpi.value}</p>
            `;
            // Remove o KPI principal da lista dos outros KPIs para evitar duplicidade na área principal
            const mainKpiIndex = allKpis.indexOf(mainKpi);
            if (mainKpiIndex > -1) {
                allKpis.splice(mainKpiIndex, 1);
            }
        }
        
        // Renderiza os demais KPIs na área principal (kpi-area-main)
        allKpis.forEach(kpi => {
            const kpiCard = document.createElement('div');
            kpiCard.classList.add('kpi-card');
            kpiCard.style.display = 'flex';
            kpiCard.innerHTML = `
                <h4>${kpi.title}</h4>
                <p style="color:${kpi.color || 'var(--primary-color)'};">${kpi.value}</p>
            `;
            kpiAreaMain.appendChild(kpiCard);
        });
    }

    // --- Renderiza Gráficos ---
    if (allCharts.length > 0) {
        allCharts.forEach((chartData, index) => {
            // Cria um novo container para cada gráfico
            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-container');
            // Atribui um ID único para cada container de gráfico dinâmico
            const chartId = `dynamic-chart-${index}`;
            chartContainer.id = chartId;
            chartGridContainer.appendChild(chartContainer);

            // Renderiza o gráfico dentro do novo container
            renderSingleChart(chartContainer, chartData, chartId);
        });
    } else {
        console.warn('Nenhum gráfico pôde ser gerado com os dados fornecidos. Verifique se há colunas numéricas, de data e/ou categóricas na sua planilha.');
        const noChartsMessage = document.createElement('p');
        noChartsMessage.textContent = 'Não foi possível gerar gráficos com as colunas detectadas. Verifique se há colunas numéricas, de data e categóricas suficientes na sua planilha.';
        chartGridContainer.appendChild(noChartsMessage);
    }
}

// analyzeAndCreateDashboardItems: Analisa os dados e sugere KPIs e Gráficos
function analyzeAndCreateDashboardItems(data) {
    if (data.length === 0) return {
        allCharts: [],
        allKpis: [],
        columnTypes: {}
    };

    const charts = [];
    const kpis = [];
    const columnTypes = {};

    const columns = Object.keys(data[0]);
    const numericColumns = [];
    const categoricalColumns = [];
    const dateColumns = [];

    columns.forEach(column => {
        // Lógica de detecção de tipo de coluna: Numérica, Data, Categórica
        // Garante que a coluna tenha pelo menos um valor não nulo/indefinido para análise de tipo
        const columnValues = data.map(row => row[column]).filter(value => value !== null && value !== undefined && value !== '');

        if (columnValues.length === 0) {
            columnTypes[column] = 'empty'; // Coluna vazia
            return;
        }
        
        const isNumeric = columnValues.every(value => !isNaN(parseFloat(value)));

        const isDate = columnValues.every(value => {
            if (typeof value === 'string') {
                return !isNaN(new Date(value));
            }
            if (typeof value === 'number') {
                // Datas do Excel são números. Assumimos um range razoável para evitar números que não são datas.
                return value > 25569 && value < 2958466; // Datas entre 1970 e aproximadamente 8000
            }
            return false;
        });
        
        // Se uma coluna é numérica E pode ser interpretada como data, priorizamos como data se todos são datas.
        if (isDate && columnValues.every(value => !isNaN(new Date(value)) || (typeof value === 'number' && value > 25569 && value < 2958466))) {
            dateColumns.push(column);
            columnTypes[column] = 'date';
        } else if (isNumeric) {
            numericColumns.push(column);
            columnTypes[column] = 'numeric';
        } else {
            categoricalColumns.push(column);
            columnTypes[column] = 'categorical';
        }
    });

    // Gera KPIs para todas as colunas numéricas
    numericColumns.forEach(column => {
        let total = 0;
        let validCount = 0;
        data.forEach(row => {
            const value = parseFloat(row[column]);
            if (!isNaN(value)) {
                total += value;
                validCount++;
            }
        });

        if (validCount > 0) { // Só cria KPI se houver dados numéricos válidos
            // Adiciona KPI de Total
            kpis.push({
                title: `Total de ${column}`,
                column: column, // Coluna original para potencial filtragem futura
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total),
                totalValue: total, // Valor numérico bruto para cálculos futuros
                type: 'total'
            });

            // Adiciona KPI de Média
            const average = total / validCount;
            kpis.push({
                title: `Média de ${column}`,
                column: column,
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(average),
                type: 'average'
            });
        }
    });

    // Sugere gráficos de linha para colunas de data vs numéricas
    dateColumns.forEach(labelColumn => {
        numericColumns.forEach(valueColumn => {
            charts.push(createChartObject(data, labelColumn, valueColumn, 'line'));
        });
    });

    // Sugere gráficos de barra/pizza para colunas categóricas vs numéricas
    categoricalColumns.forEach(labelColumn => {
        numericColumns.forEach(valueColumn => {
            charts.push(createChartObject(data, labelColumn, valueColumn, 'bar')); // createChartObject decide entre bar/pie
        });
    });

    // Opcional: Ordenar gráficos para melhor visualização (ex: linhas primeiro)
    charts.sort((a, b) => {
        if (a.chartType === 'line' && b.chartType !== 'line') return -1;
        if (a.chartType !== 'line' && b.chartType === 'line') return 1;
        // Ordena por título se os tipos forem iguais
        return a.title.localeCompare(b.title);
    });

    return {
        allCharts: charts,
        allKpis: kpis,
        columnTypes: columnTypes
    };
}

// createChartObject: Agrega dados e decide o tipo de gráfico (barra ou pizza)
function createChartObject(data, labelColumn, valueColumn, suggestedType) {
    const aggregatedData = {};
    data.forEach(row => {
        let label = row[labelColumn];
        const value = parseFloat(row[valueColumn]);

        // Trata a conversão de datas Excel para strings legíveis
        if (typeof label === 'number' && label > 25569 && label < 2958466) {
            const excelDate = new Date(Math.round((label - 25569) * 86400 * 1000));
            label = excelDate.toLocaleDateString('pt-BR');
        } else if (label === null || label === undefined || String(label).trim() === '') {
            label = "N/A"; // Lida com rótulos vazios ou nulos
        }

        if (!isNaN(value)) { // Só agrega se o valor for numérico válido
            if (aggregatedData[label]) {
                aggregatedData[label] += value;
            } else {
                aggregatedData[label] = value;
            }
        }
    });

    const aggregatedLabels = Object.keys(aggregatedData);
    const aggregatedValues = aggregatedLabels.map(label => aggregatedData[label]);

    let chartType = suggestedType;
    // Sugere gráfico de pizza para menos de 8 categorias para gráficos de barra (e mais de 1 categoria)
    if (suggestedType === 'bar' && aggregatedLabels.length < 8 && aggregatedLabels.length > 1) {
        chartType = 'pie';
    }

    return {
        chartType: chartType,
        title: `${valueColumn} por ${labelColumn}`, // Título dinâmico
        labels: aggregatedLabels,
        data: aggregatedValues,
        labelColumn: labelColumn, // Mantém a coluna original para filtragem
        valueColumn: valueColumn, // Mantém a coluna original para filtragem
        type: suggestedType // Mantém o tipo sugerido para reuso
    };
}


// renderSingleChart: Renderiza um único gráfico usando Chart.js
function renderSingleChart(containerElement, chartData, chartId) {
    // Destrói o gráfico existente se houver (importante para re-renderizações e troca de tema)
    if (allChartsInstances[chartId]) {
        allChartsInstances[chartId].destroy();
    }

    // Limpa o conteúdo do container para garantir que não haja lixo visual
    containerElement.innerHTML = '';

    const chartTitle = document.createElement('h3');
    chartTitle.textContent = chartData.title;
    containerElement.appendChild(chartTitle);

    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    const isDarkMode = document.body.classList.contains('theme-dark');
    // Cores base para os gráficos (ajustadas para temas claro/escuro via CSS)
    const defaultChartColor = isDarkMode ? 'var(--chart-color-1-dark)' : 'var(--chart-color-1-light)';
    const defaultBorderColor = isDarkMode ? 'var(--chart-color-2-dark)' : 'var(--chart-color-2-light)';
    const fontColor = isDarkMode ? 'var(--dark-text)' : 'var(--light-text)';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const ctx = canvas.getContext('2d');
    const newChart = new Chart(ctx, {
        type: chartData.chartType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.title,
                data: chartData.data,
                fill: chartData.chartType === 'line' ? true : false,
                backgroundColor: chartData.chartType === 'pie' ? getPieChartColors(chartData.labels.length, isDarkMode) : defaultChartColor,
                borderColor: chartData.chartType === 'pie' ? null : defaultBorderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: (chartData.chartType === 'bar' || chartData.chartType === 'line') ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: fontColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    type: 'category',
                    ticks: {
                        color: fontColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            } : {},
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: fontColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            // Formatação de moeda para tooltips de gráficos numéricos
                            if (context.parsed.y !== undefined) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            } else if (context.parsed.x !== undefined) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.x);
                            } else if (context.parsed !== undefined) {
                                // Para gráficos de pizza, context.parsed é o valor
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                // Lógica de clique para filtrar o dashboard
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const label = chartData.labels[firstElement.index]; // O valor clicado no eixo (ex: "Janeiro", "São Paulo")
                    const clickedColumn = chartData.labelColumn; // A coluna original da planilha que gerou esse rótulo (ex: "Mês", "Estado")

                    // Aplica o filtro. Se o mesmo filtro já estiver ativo, desativa.
                    if (filters[clickedColumn] === label) {
                        delete filters[clickedColumn];
                        console.log(`Filtro removido: ${clickedColumn} = "${label}".`);
                    } else {
                        filters[clickedColumn] = label;
                        console.log(`Filtro aplicado: ${clickedColumn} = "${label}".`);
                    }
                    console.log('Filtros atuais:', filters);
                    filterDataAndRender(); // Re-renderiza o dashboard com o novo filtro
                }
            }
        }
    });
    allChartsInstances[chartId] = newChart; // Armazena a nova instância do gráfico
}

// buildFilterUI: Constrói a interface de filtros dinamicamente
function buildFilterUI(data) {
    const filterArea = sidebarFilterArea;
    filterArea.innerHTML = '';
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    // Filtra colunas que não são puramente numéricas para serem usadas como filtros
    // Isso inclui colunas categóricas e de data
    const filterableColumns = columns.filter(column => {
        const columnValues = data.map(row => row[column]).filter(value => value !== null && value !== undefined && String(value).trim() !== '');
        if (columnValues.length === 0) return false; // Não cria filtro para colunas vazias

        const isNumeric = columnValues.every(value => !isNaN(parseFloat(value)));
        const isDate = columnValues.every(value => {
            if (typeof value === 'string') return !isNaN(new Date(value));
            if (typeof value === 'number') return value > 25569 && value < 2958466;
            return false;
        });
        
        // Se é uma data, ou se não é numérica (categórica), ela é filtrável
        return isDate || !isNumeric;
    });

    filterableColumns.forEach(column => {
        const uniqueValues = [...new Set(data.map(item => {
            let value = item[column];
            // Normaliza datas excel ou valores nulos/vazios para string "N/A" para o filtro
            if (typeof value === 'number' && value > 25569 && value < 2958466) {
                const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
                return excelDate.toLocaleDateString('pt-BR');
            } else if (value === null || value === undefined || String(value).trim() === '') {
                return "N/A";
            }
            return String(value);
        }))].sort();

        const filterGroup = document.createElement('div');
        filterGroup.classList.add('filter-group');

        const label = document.createElement('label');
        label.textContent = column;

        const select = document.createElement('select');
        select.id = `filter-${column}`;

        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Todos';
        select.appendChild(allOption);

        uniqueValues.forEach(value => {
            if (value !== undefined && value !== null && value !== '') {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            }
        });

        // Define o valor selecionado se um filtro já estiver ativo
        if (filters[column]) {
            select.value = filters[column];
        }

        select.addEventListener('change', (e) => {
            if (e.target.value === 'all') {
                delete filters[column];
            } else {
                filters[column] = e.target.value;
            }
            filterDataAndRender();
        });

        filterGroup.appendChild(label);
        filterGroup.appendChild(select);
        filterArea.appendChild(filterGroup);
    });
}

// filterDataAndRender: Aplica os filtros e re-renderiza o dashboard
function filterDataAndRender() {
    let filteredData = rawData; // Começa com os dados brutos da planilha ativa
    Object.keys(filters).forEach(filterKey => {
        const filterValue = filters[filterKey];
        if (filterValue !== 'all') {
            filteredData = filteredData.filter(row => {
                let rowValue = row[filterKey];
                // Normaliza o valor da linha para comparação com o filtro
                if (typeof rowValue === 'number' && rowValue > 25569 && rowValue < 2958466 && typeof filterValue === 'string') {
                    const excelDate = new Date(Math.round((rowValue - 25569) * 86400 * 1000));
                    rowValue = excelDate.toLocaleDateString('pt-BR');
                } else if (rowValue === null || rowValue === undefined || String(rowValue).trim() === '') {
                    rowValue = "N/A"; // Garante que N/A na planilha filtre N/A
                } else {
                    rowValue = String(rowValue);
                }
                return rowValue === String(filterValue);
            });
        }
    });

    buildDashboard(filteredData); // Chama buildDashboard com os dados filtrados
}

// getPieChartColors: Fornece uma paleta de cores consistente para gráficos de pizza
function getPieChartColors(count, isDarkMode) {
    // Cores mais vibrantes e profissionais, adaptadas para temas
    const lightColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
        '#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#22D3EE', '#F472B6', '#C084FC', '#A8A29E', '#EAB308'
    ];
    const darkColors = [
        '#6366F1', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#22D3EE', '#F472B6', '#C084FC', '#A8A29E', '#EAB308'
    ];

    const colors = isDarkMode ? darkColors : lightColors;
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// setTheme: Altera o tema do dashboard
function setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('theme', themeName);
    // Se há dados carregados, re-renderiza o dashboard para aplicar o novo tema visualmente
    if (rawData.length > 0) {
        buildDashboard(rawData); // Re-renderiza o dashboard com os dados atuais e o novo tema
        // Re-cria os filtros para garantir que o texto e a aparência estejam corretos no novo tema
        buildFilterUI(rawData);
    }
}