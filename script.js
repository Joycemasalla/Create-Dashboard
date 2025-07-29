// Variáveis globais para os elementos do DOM e dados
let rawData = []; // Dados da planilha atualmente ATIVA
let uploadedSheets = []; // Array de todas as planilhas carregadas: [{ name: "nome.xlsx", data: [...] }, ...]
let currentActiveSheetIndex = -1; // Índice da planilha atualmente visível
const filters = {}; // Objeto para armazenar os filtros ativos
// allChartsInstances agora é global para script.js e charts.js
let allChartsInstances = {}; // Armazenará as instâncias dos gráficos Chart.js para destruição/recriação

// Referências aos elementos do DOM (serão inicializadas em DOMContentLoaded)
let uploadSection;
let dashboardContainer;
let dashboardTitle;
let sidebarFilterArea;
let kpiAreaMain;
let kpiQuantidade;
let chartGridContainer; // Container pai para os gráficos dinâmicos
let uploadedSheetsArea; // Área para listar planilhas carregadas na sidebar
let uploadedSheetsList; // Lista <ul> dentro da área de planilhas
let newSheetButton; // Botão para adicionar nova planilha
let exampleDataAlert; // Banner de alerta de dados de exemplo
let clearFiltersButton; // Botão de limpar filtros
let themeLightButton; // Botão para tema claro
let themeDarkButton; // Botão para tema escuro
let insightWidgetsContainer; // Contêiner para os widgets de insights


// As funções analyzeAndCreateDashboardItems, createChartObject, getCssVariable, getChartColors, renderSingleChart
// ESTÃO DEFINIDAS NO ARQUIVO charts.js e são acessíveis aqui.


// renderInsightWidgets: Cria e exibe os widgets de insights
function renderInsightWidgets(insights) {
    const container = insightWidgetsContainer;
    container.innerHTML = ''; // Limpa insights anteriores

    if (!insights || insights.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'grid'; // Garante que o contêiner seja exibido

    insights.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.classList.add('insight-card');
        insightCard.innerHTML = `
            <div class="icon-check"><i class="${insight.icon || 'fas fa-check-circle'}"></i></div>
            <p>${insight.text}</p>
        `;
        container.appendChild(insightCard);
    });
}


// buildFilterUI: Constrói a interface de filtros dinamicamente
function buildFilterUI(data) {
    const filterArea = sidebarFilterArea;
    filterArea.innerHTML = '';
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const filterableColumns = columns.filter(column => {
        const columnValues = data.map(row => row[column]).filter(value => value !== null && value !== undefined && String(value).trim() !== '');
        if (columnValues.length === 0) return false;

        const isNumeric = columnValues.every(value => !isNaN(parseFloat(value)));
        const isDate = columnValues.every(value => {
            if (typeof value === 'string') return !isNaN(new Date(value));
            if (typeof value === 'number') return value > 25569 && value < 2958466;
            return false;
        });
        
        return isDate || !isNumeric;
    });

    filterableColumns.forEach(column => {
        const uniqueValues = [...new Set(data.map(item => {
            let value = item[column];
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

// clearAllFilters: Limpa todos os filtros e re-renderiza o dashboard
function clearAllFilters(reRender = true) {
    for (const key in filters) {
        delete filters[key];
    }
    if (rawData.length > 0) {
        buildFilterUI(rawData);
    }
    if (reRender) {
        filterDataAndRender();
    }
    console.log('Todos os filtros foram limpos.');
}

// filterDataAndRender: Aplica os filtros e re-renderiza o dashboard
function filterDataAndRender() {
    let filteredData = rawData;
    Object.keys(filters).forEach(filterKey => {
        const filterValue = filters[filterKey];
        if (filterValue !== 'all') {
            filteredData = filteredData.filter(row => {
                let rowValue = row[filterKey];
                if (typeof rowValue === 'number' && rowValue > 25569 && rowValue < 2958466 && typeof filterValue === 'string') {
                    const excelDate = new Date(Math.round((rowValue - 25569) * 86400 * 1000));
                    rowValue = excelDate.toLocaleDateString('pt-BR');
                } else if (rowValue === null || rowValue === undefined || String(rowValue).trim() === '') {
                    rowValue = "N/A";
                } else {
                    rowValue = String(rowValue);
                }
                return rowValue === String(filterValue);
            });
        }
    });

    buildDashboard(filteredData);
}

// buildDashboard: Função principal para construir e renderizar o dashboard
// Depende das funções de gráfico definidas em charts.js
function buildDashboard(data) {
    for (const chartId in allChartsInstances) {
        if (allChartsInstances[chartId]) {
            allChartsInstances[chartId].destroy();
        }
    }
    allChartsInstances = {}; 

    kpiAreaMain.innerHTML = '';
    kpiAreaMain.style.display = 'grid';
    kpiQuantidade.innerHTML = '';
    kpiQuantidade.style.display = 'none';
    chartGridContainer.innerHTML = '';
    insightWidgetsContainer.innerHTML = ''; 
    insightWidgetsContainer.style.display = 'none'; 

    const {
        allCharts,
        allKpis,
        columnTypes,
        insights 
    } = analyzeAndCreateDashboardItems(data);

    // Renderiza os widgets de insights
    renderInsightWidgets(insights);

    if (allKpis.length > 0) {
        let mainKpi = allKpis.find(kpi => kpi.type === 'total' && kpi.title.toLowerCase().includes('vendas'));
        if (!mainKpi) {
            mainKpi = allKpis.find(kpi => kpi.type === 'total' && kpi.totalValue !== undefined);
        }
        if (!mainKpi && allKpis.length > 0) {
            mainKpi = allKpis[0];
        }

        if (mainKpi) {
            kpiQuantidade.style.display = 'flex';
            kpiQuantidade.innerHTML = `
                <div class="kpi-icon"><i class="fas ${mainKpi.icon || 'fa-calculator'}"></i></div>
                <h4>${mainKpi.title}</h4>
                <p style="color:${mainKpi.color || 'var(--success-color)'};">${mainKpi.value}</p>
            `;
            kpiQuantidade.addEventListener('click', () => {
                alert(`Clicou no KPI principal: ${mainKpi.title}.`);
            });

            const mainKpiIndex = allKpis.indexOf(mainKpi);
            if (mainKpiIndex > -1) {
                allKpis.splice(mainKpiIndex, 1);
            }
        }
        
        allKpis.forEach(kpi => {
            const kpiCard = document.createElement('div');
            kpiCard.classList.add('kpi-card');
            kpiCard.dataset.filterColumn = kpi.column; 
            kpiCard.dataset.filterValue = kpi.value; 
            kpiCard.dataset.filterKpiType = kpi.type; 

            kpiCard.addEventListener('click', (e) => {
                alert(`Clicou no KPI: ${kpi.title}.`);
            });


            kpiCard.innerHTML = `
                <div class="kpi-icon"><i class="fas ${kpi.icon || 'fa-chart-simple'}"></i></div>
                <h4>${kpi.title}</h4>
                <p style="color:${kpi.color || 'var(--primary-color)'};">${kpi.value}</p>
            `;
            kpiAreaMain.appendChild(kpiCard);
        });
    }

    if (allCharts.length > 0) {
        allCharts.forEach((chartData, index) => {
            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-container');
            const chartId = `dynamic-chart-${index}`;
            chartContainer.id = chartId;
            chartGridContainer.appendChild(chartContainer);

            // renderSingleChart é uma função global de charts.js
            renderSingleChart(chartContainer, chartData, chartId);
        });
    } else {
        console.warn('Nenhum gráfico pôde ser gerado com os dados fornecidos. Verifique se há colunas numéricas, de data e/ou categóricas na sua planilha.');
        const noChartsMessage = document.createElement('p');
        noChartsMessage.textContent = 'Não foi possível gerar gráficos com as colunas detectadas. Verifique se há colunas numéricas, de data e categóricas suficientes na sua planilha.';
        chartGridContainer.appendChild(noChartsMessage);
    }
}


// --- Funções de Manipulação de Planilhas e Tema ---

// updateUploadedSheetsUI: Atualiza a lista de planilhas carregadas na sidebar
function updateUploadedSheetsUI() {
    uploadedSheetsList.innerHTML = '';
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
        listItem.dataset.index = index;

        const removeButton = document.createElement('button');
        removeButton.classList.add('sheet-remove-btn');
        removeButton.innerHTML = '&#x2715;';
        removeButton.title = `Remover ${sheet.name}`;
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSheet(index);
        });

        listItem.appendChild(removeButton);

        listItem.addEventListener('click', () => loadSheet(index));
        uploadedSheetsList.appendChild(listItem);
    });
}

// loadSheet: Carrega uma planilha anterior para visualização
function loadSheet(index) {
    if (index === currentActiveSheetIndex) return;

    currentActiveSheetIndex = index;
    rawData = uploadedSheets[index].data;
    
    for (const key in filters) {
        delete filters[key];
    }
    
    dashboardTitle.textContent = `Dashboard: ${uploadedSheets[index].name}`;
    buildDashboard(rawData);
    buildFilterUI(rawData);
    updateUploadedSheetsUI();
    dashboardContainer.style.display = 'grid'; 
    uploadSection.style.display = 'none'; 
}

// removeSheet: Remove uma planilha da lista
function removeSheet(indexToRemove) {
    if (indexToRemove === currentActiveSheetIndex) {
        rawData = [];
        dashboardContainer.style.display = 'none';
        uploadSection.style.display = 'flex'; 
        dashboardTitle.textContent = 'Crie seu Dashboard';
        exampleDataAlert.style.display = 'block';
        clearAllFilters(false);
        kpiAreaMain.innerHTML = '';
        kpiQuantidade.innerHTML = '';
        chartGridContainer.innerHTML = '';
        sidebarFilterArea.innerHTML = '';
        insightWidgetsContainer.innerHTML = ''; 
        insightWidgetsContainer.style.display = 'none';
        for (const chartId in allChartsInstances) {
            if (allChartsInstances[chartId]) {
                allChartsInstances[chartId].destroy();
            }
        }
        allChartsInstances = {};
    }

    uploadedSheets.splice(indexToRemove, 1);

    if (currentActiveSheetIndex > indexToRemove) {
        currentActiveSheetIndex--;
    } else if (currentActiveSheetIndex === indexToRemove && uploadedSheets.length > 0) {
        currentActiveSheetIndex = uploadedSheets.length - 1;
        loadSheet(currentActiveSheetIndex);
    } else if (uploadedSheets.length === 0) {
        currentActiveSheetIndex = -1;
        uploadSection.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        dashboardTitle.textContent = 'Crie seu Dashboard';
        exampleDataAlert.style.display = 'block';
        insightWidgetsContainer.innerHTML = ''; 
        insightWidgetsContainer.style.display = 'none';
    }

    updateUploadedSheetsUI();
}

// setTheme: Altera o tema do dashboard
function setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('theme', themeName);
    if (rawData.length > 0) {
        buildDashboard(rawData);
        buildFilterUI(rawData);
    }
}


// --- Função Principal de Upload ---

// handleUpload: Função principal para lidar com o upload da planilha
async function handleUpload() {
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione uma planilha para enviar.');
        return;
    }

    uploadSection.style.display = 'none';
    dashboardContainer.style.display = 'grid';
    dashboardTitle.textContent = 'Analisando dados...';
    exampleDataAlert.style.display = 'none';

    for (const key in filters) {
        delete filters[key];
    }
    rawData = []; 

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
            dashboardTitle.textContent = `Dashboard: ${file.name}`;
            const newSheetData = {
                name: file.name,
                data: result.data
            };
            uploadedSheets.push(newSheetData);
            currentActiveSheetIndex = uploadedSheets.length - 1;
            rawData = newSheetData.data;

            console.log('Cabeçalhos da Planilha:', Object.keys(rawData[0] || {}));

            if (rawData.length > 0) {
                buildDashboard(rawData);
                buildFilterUI(rawData);
                updateUploadedSheetsUI();
                uploadedSheetsArea.style.display = 'block'; 
            } else {
                dashboardTitle.textContent = 'Atenção';
                uploadSection.style.display = 'flex';
                dashboardContainer.style.display = 'none';
                alert('A planilha está vazia ou não contém dados válidos.');
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
    catch (error) {
        console.error('Erro:', error);
        dashboardTitle.textContent = 'Erro ao gerar o dashboard';
        uploadSection.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        alert(`Ocorreu um erro: ${error.message}. Por favor, verifique se o servidor está rodando (npm start) e tente novamente.`);
    }
}


// --- Event Listener Principal (garante que o DOM esteja totalmente carregado) ---

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
    clearFiltersButton = document.getElementById('clear-filters-button');
    insightWidgetsContainer = document.getElementById('insight-widgets-container'); 


    const requiredElements = [
        uploadSection, dashboardContainer, dashboardTitle, sidebarFilterArea,
        kpiAreaMain, kpiQuantidade, chartGridContainer,
        themeLightButton, themeDarkButton, currentDateSpan,
        loggedUserSpan, uploadButton, fileInput, uploadedSheetsArea,
        uploadedSheetsList, newSheetButton, exampleDataAlert, clearFiltersButton,
        insightWidgetsContainer 
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
        fileInput.value = '';
        uploadSection.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        dashboardTitle.textContent = 'Crie seu Dashboard';
        exampleDataAlert.style.display = 'block';
        uploadedSheetsArea.style.display = 'none';
    });
    themeLightButton.addEventListener('click', () => setTheme('light'));
    themeDarkButton.addEventListener('click', () => setTheme('dark'));
    clearFiltersButton.addEventListener('click', clearAllFilters);

    // 3. Define o estado inicial da UI
    uploadSection.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    uploadedSheetsArea.style.display = 'none';
    exampleDataAlert.style.display = 'block';
    insightWidgetsContainer.style.display = 'none'; 

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