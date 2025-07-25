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
let clearFiltersButton; // Novo botão de limpar filtros


// --- Funções de Análise e Construção de Dashboard (Definidas antes do uso) ---

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
        const columnValues = data.map(row => row[column]).filter(value => value !== null && value !== undefined && value !== '');

        if (columnValues.length === 0) {
            columnTypes[column] = 'empty';
            return;
        }
        
        const isNumeric = columnValues.every(value => !isNaN(parseFloat(value)));

        const isDate = columnValues.every(value => {
            if (typeof value === 'string') {
                return !isNaN(new Date(value));
            }
            if (typeof value === 'number') {
                return value > 25569 && value < 2958466;
            }
            return false;
        });
        
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

    numericColumns.forEach(column => {
        let total = 0;
        let validCount = 0;
        let max = -Infinity;
        data.forEach(row => {
            const value = parseFloat(row[column]);
            if (!isNaN(value)) {
                total += value;
                validCount++;
                if (value > max) {
                    max = value;
                }
            }
        });

        if (validCount > 0) {
            kpis.push({
                title: `Total de ${column}`,
                column: column,
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total),
                totalValue: total,
                type: 'total',
                color: 'var(--success-color)'
            });

            const average = total / validCount;
            kpis.push({
                title: `Média de ${column}`,
                column: column,
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(average),
                type: 'average',
                color: 'var(--info-color)'
            });

            if (isFinite(max)) {
                kpis.push({
                    title: `Máximo de ${column}`,
                    column: column,
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(max),
                    type: 'max',
                    color: 'var(--warning-color)'
                });
            }
        }
    });

    dateColumns.forEach(labelColumn => {
        numericColumns.forEach(valueColumn => {
            charts.push(createChartObject(data, labelColumn, valueColumn, 'line'));
        });
    });

    categoricalColumns.forEach(labelColumn => {
        numericColumns.forEach(valueColumn => {
            charts.push(createChartObject(data, labelColumn, valueColumn, 'bar'));
        });
    });

    charts.sort((a, b) => {
        if (a.chartType === 'line' && b.chartType !== 'line') return -1;
        if (a.chartType !== 'line' && b.chartType === 'line') return 1;
        return a.title.localeCompare(b.title);
    });

    return {
        allCharts: charts,
        allKpis: kpis,
        columnTypes: columnTypes
    };
}

// createChartObject: Agrega dados e decide o tipo de gráfico (barra ou pizza/rosquinha)
function createChartObject(data, labelColumn, valueColumn, suggestedType) {
    const aggregatedData = {};
    data.forEach(row => {
        let label = row[labelColumn];
        const value = parseFloat(row[valueColumn]);

        if (typeof label === 'number' && label > 25569 && label < 2958466) {
            const excelDate = new Date(Math.round((label - 25569) * 86400 * 1000));
            label = excelDate.toLocaleDateString('pt-BR');
        } else if (label === null || label === undefined || String(label).trim() === '') {
            label = "N/A";
        }

        if (!isNaN(value)) {
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
    if (suggestedType === 'bar' && aggregatedLabels.length < 8 && aggregatedLabels.length > 1) {
        chartType = 'pie';
    }

    return {
        chartType: chartType,
        title: `${valueColumn} por ${labelColumn}`,
        labels: aggregatedLabels,
        data: aggregatedValues,
        labelColumn: labelColumn,
        valueColumn: valueColumn,
        type: suggestedType
    };
}

// getCssVariable: Função auxiliar para obter o valor de uma variável CSS
function getCssVariable(varName) {
    return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

// getChartColors: Fornece uma paleta de cores consistente para gráficos
function getChartColors(count, isDarkMode, type) {
    const lightColors = [
        '--chart-color-1-light', '--chart-color-2-light', '--chart-color-3-light',
        '--chart-color-4-light', '--chart-color-5-light', '--chart-color-6-light',
        '--chart-color-7-light', '--chart-color-8-light'
    ];
    const darkColors = [
        '--chart-color-1-dark', '--chart-color-2-dark', '--chart-color-3-dark',
        '--chart-color-4-dark', '--chart-color-5-dark', '--chart-color-6-dark',
        '--chart-color-7-dark', '--chart-color-8-dark'
    ];

    const colorVars = isDarkMode ? darkColors : lightColors;
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(getCssVariable(colorVars[i % colorVars.length]));
    }

    // Se for um gráfico de barra ou linha e tiver apenas uma cor, use a primeira cor da paleta
    if (type !== 'doughnut' && type !== 'pie' && count === 1) {
        return getCssVariable(colorVars[0]);
    }

    return result;
}

// renderSingleChart: Renderiza um único gráfico usando Chart.js
function renderSingleChart(containerElement, chartData, chartId) {
    if (allChartsInstances[chartId]) {
        allChartsInstances[chartId].destroy();
    }

    containerElement.innerHTML = '';

    const chartTitle = document.createElement('h3');
    chartTitle.textContent = chartData.title;
    containerElement.appendChild(chartTitle);

    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    const isDarkMode = document.body.classList.contains('theme-dark');
    
    // Obtendo cores dinamicamente via getCssVariable
    const fontColor = getCssVariable(isDarkMode ? '--dark-text' : '--light-text');
    const gridColor = getCssVariable(isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
    const cardBgColor = getCssVariable(isDarkMode ? '--dark-card-bg' : '--light-card-bg');


    const ctx = canvas.getContext('2d');
    const chartJsType = chartData.chartType === 'pie' ? 'doughnut' : chartData.chartType;

    // A cor de fundo principal e a cor da borda para gráficos de barra/linha virão de getChartColors
    const backgroundColorForBarLine = getChartColors(1, isDarkMode, chartJsType)[0]; // Pega a primeira cor para barra/linha
    const borderColorForBarLine = getChartColors(2, isDarkMode, chartJsType)[0]; // Pega a segunda cor para borda, ou a primeira para consistencia


    const newChart = new Chart(ctx, {
        type: chartJsType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.title,
                data: chartData.data,
                fill: chartJsType === 'line' ? true : false, // Preenche a área para gráficos de linha (Area Chart)
                backgroundColor: chartJsType === 'doughnut' ? getChartColors(chartData.labels.length, isDarkMode, chartJsType) : backgroundColorForBarLine,
                borderColor: chartJsType === 'doughnut' ? cardBgColor : borderColorForBarLine, // Borda da cor do card para doughnut, senão a cor padrão
                borderWidth: chartJsType === 'doughnut' ? 2 : 1, // Borda mais grossa para doughnut
                tension: 0.4 // Suaviza as linhas para gráficos de linha
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                animationDuration: 400
            },
            scales: (chartJsType === 'bar' || chartJsType === 'line') ? {
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
                    position: chartJsType === 'doughnut' ? 'right' : 'top',
                    labels: {
                        color: fontColor,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== undefined) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            } else if (context.parsed.x !== undefined) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.x);
                            } else if (context.parsed.hasOwnProperty('parsed')) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const label = chartData.labels[firstElement.index];
                    const clickedColumn = chartData.labelColumn;

                    if (filters[clickedColumn] === label) {
                        delete filters[clickedColumn];
                        console.log(`Filtro removido: ${clickedColumn} = "${label}".`);
                    } else {
                        filters[clickedColumn] = label;
                        console.log(`Filtro aplicado: ${clickedColumn} = "${label}".`);
                    }
                    console.log('Filtros atuais:', filters);
                    filterDataAndRender();
                }
            }
        }
    });
    allChartsInstances[chartId] = newChart;
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

    const {
        allCharts,
        allKpis,
        columnTypes
    } = analyzeAndCreateDashboardItems(data);

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
                <h4>${mainKpi.title}</h4>
                <p style="color:${mainKpi.color || 'var(--success-color)'};">${mainKpi.value}</p>
            `;
            const mainKpiIndex = allKpis.indexOf(mainKpi);
            if (mainKpiIndex > -1) {
                allKpis.splice(mainKpiIndex, 1);
            }
        }
        
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

    if (allCharts.length > 0) {
        allCharts.forEach((chartData, index) => {
            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-container');
            const chartId = `dynamic-chart-${index}`;
            chartContainer.id = chartId;
            chartGridContainer.appendChild(chartContainer);

            renderSingleChart(chartContainer, chartData, chartId);
        });
    } else {
        console.warn('Nenhum gráfico pôde ser gerado com os dados fornecidos. Verifique se há colunas numéricas, de data e/ou categóricas na sua planilha.');
        const noChartsMessage = document.createElement('p');
        noChartsMessage.textContent = 'Não foi possível gerar gráficos com as colunas detectadas. Verifique se há colunas numéricas, de data e categóricas suficientes na sua planilha.';
        chartGridContainer.appendChild(noChartsMessage);
    }
}


// --- Funções de Manipulação de Planilhas e Tema (Definidas após as funções de análise, mas antes do DOMContentLoaded) ---

// updateUploadedSheetsUI: Atualiza a lista de planilhas carregadas na sidebar do upload
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


// --- Função Principal de Upload (Definida por último, pois depende das demais) ---

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

    const requiredElements = [
        uploadSection, dashboardContainer, dashboardTitle, sidebarFilterArea,
        kpiAreaMain, kpiQuantidade, chartGridContainer,
        themeLightButton, themeDarkButton, currentDateSpan,
        loggedUserSpan, uploadButton, fileInput, uploadedSheetsArea,
        uploadedSheetsList, newSheetButton, exampleDataAlert, clearFiltersButton
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
    });
    themeLightButton.addEventListener('click', () => setTheme('light'));
    themeDarkButton.addEventListener('click', () => setTheme('dark'));
    clearFiltersButton.addEventListener('click', clearAllFilters);

    // 3. Define o estado inicial da UI
    uploadSection.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    uploadedSheetsArea.style.display = 'none';
    exampleDataAlert.style.display = 'block';

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