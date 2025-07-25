// Variáveis globais para os elementos do DOM e dados
let rawData = [];
const filters = {};
let currentDashboardTemplate = 'acompanhamento_vendas';

// Referências aos elementos do DOM (serão inicializadas em DOMContentLoaded)
let uploadSection;
let dashboardContainer;
let dashboardTitle;
let sidebarFilterArea;
let kpiAreaMain;
let kpiQuantidade;
let faturamentoMensalChart;
let top10ClientesChart;
let faturamentoVendedorChart;
let canalVendasChart;
let top10ProdutosChart;
let themeLightButton;
let themeDarkButton;
let templateSelect;
let currentDateSpan;
let loggedUserSpan;
let uploadButton;
let fileInput;


// Define os modelos de dashboard disponíveis e mapeia para os IDs de elementos HTML
const dashboardTemplates = {
    'acompanhamento_vendas': { // Este é o modelo baseado na imagem que você enviou
        kpis: [ // KPI defs para a área kpi-area-main (os 4 primeiros da esquerda para direita)
            {
                title: 'Faturamento',
                column: 'Faturamento',
                color: '#FF6384',
                icon: '💰'
            }, // Adicione cores e ícones conforme o modelo
            {
                title: 'Custo',
                column: 'Custo',
                color: '#36A2EB',
                icon: '💸'
            },
            {
                title: 'Lucro',
                column: 'Lucro',
                color: 'rgb(57, 181, 74)',
                icon: '📈'
            }, // Verde para lucro
            {
                title: 'Ticket Médio',
                column: 'Ticket Médio',
                color: '#FFCE56',
                icon: '🎟️'
            } // Exemplo: se houver uma coluna 'Ticket Médio'
        ],
        mainKpiId: 'kpi-quantidade', // ID do KPI grande
        mainKpiDef: {
            title: 'Quantidade',
            column: 'Quantidade',
            color: 'rgb(57, 181, 74)',
            icon: '📦'
        }, // KPI grande de Quantidade

        charts: [
            {
                id: 'faturamento-mensal-chart',
                labelColumn: 'Mês',
                valueColumn: 'Faturamento',
                type: 'line',
                title: 'FATURAMENTO MENSAL'
            }, // Exemplo: se houver Mês e Faturamento
            {
                id: 'top10-clientes-chart',
                labelColumn: 'Cliente',
                valueColumn: 'Faturamento',
                type: 'bar',
                title: 'TOP 10 FATURAMENTO CLIENTES'
            },
            {
                id: 'faturamento-vendedor-chart',
                labelColumn: 'Vendedor',
                valueColumn: 'Faturamento',
                type: 'bar',
                title: 'FATURAMENTO POR VENDEDOR'
            },
            {
                id: 'canal-vendas-chart',
                labelColumn: 'Canal de Vendas',
                valueColumn: 'Vendas',
                type: 'pie',
                title: 'CANAL DE VENDAS'
            },
            {
                id: 'top10-produtos-chart',
                labelColumn: 'Produto',
                valueColumn: 'Faturamento',
                type: 'bar',
                title: 'TOP 10 FATURAMENTO PRODUTOS'
            }
        ],
    },
    'default': {
        kpis: [
            {
                id: 'kpi-area-main',
                items: [
                    {
                        title: 'Total de Vendas',
                        column: 'Vendas'
                    },
                    {
                        title: 'Total de Custo',
                        column: 'Custo'
                    }
                ]
            },
        ],
        charts: [
            {
                id: 'faturamento-mensal-chart',
                labelColumn: 'Data',
                valueColumn: 'Vendas',
                type: 'line'
            },
            {
                id: 'top10-clientes-chart',
                labelColumn: 'Produto',
                valueColumn: 'Vendas',
                type: 'bar'
            },
            {
                id: 'canal-vendas-chart',
                labelColumn: 'Regiao',
                valueColumn: 'Vendas',
                type: 'pie'
            },
        ]
    }
};


document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa as referências dos elementos do DOM
    // **** ATENÇÃO: VERIFIQUE OS CONSOLE.LOG ABAIXO PARA VER QUAL ELEMENTO ESTÁ 'null' ****
    uploadSection = document.querySelector('.upload-section');
    console.log('uploadSection:', uploadSection);
    dashboardContainer = document.getElementById('dashboard-container');
    console.log('dashboardContainer:', dashboardContainer);
    dashboardTitle = document.getElementById('dashboard-title');
    console.log('dashboardTitle:', dashboardTitle); // <--- ESTA É A LINHA CRÍTICA QUE ESTÁ DANDO 'null'
    sidebarFilterArea = document.getElementById('sidebar-filter-area');
    console.log('sidebarFilterArea:', sidebarFilterArea);
    kpiAreaMain = document.getElementById('kpi-area-main');
    console.log('kpiAreaMain:', kpiAreaMain);
    kpiQuantidade = document.getElementById('kpi-quantidade');
    console.log('kpiQuantidade:', kpiQuantidade);
    faturamentoMensalChart = document.getElementById('faturamento-mensal-chart');
    console.log('faturamentoMensalChart:', faturamentoMensalChart);
    top10ClientesChart = document.getElementById('top10-clientes-chart');
    console.log('top10ClientesChart:', top10ClientesChart);
    faturamentoVendedorChart = document.getElementById('faturamento-vendedor-chart');
    console.log('faturamentoVendedorChart:', faturamentoVendedorChart);
    canalVendasChart = document.getElementById('canal-vendas-chart');
    console.log('canalVendasChart:', canalVendasChart);
    top10ProdutosChart = document.getElementById('top10-produtos-chart');
    console.log('top10ProdutosChart:', top10ProdutosChart);
    themeLightButton = document.getElementById('theme-light-button');
    console.log('themeLightButton:', themeLightButton);
    themeDarkButton = document.getElementById('theme-dark-button');
    console.log('themeDarkButton:', themeDarkButton);
    templateSelect = document.getElementById('dashboard-template-select');
    console.log('templateSelect:', templateSelect);
    currentDateSpan = document.getElementById('current-date');
    console.log('currentDateSpan:', currentDateSpan);
    loggedUserSpan = document.getElementById('logged-user');
    console.log('loggedUserSpan:', loggedUserSpan);
    uploadButton = document.getElementById('upload-button');
    console.log('uploadButton:', uploadButton);
    fileInput = document.getElementById('file-input');
    console.log('fileInput:', fileInput);

    // **Verificação de segurança:** Confirma que todos os elementos essenciais foram encontrados
    const requiredElements = [
        uploadSection, dashboardContainer, dashboardTitle, sidebarFilterArea,
        kpiAreaMain, kpiQuantidade, faturamentoMensalChart, top10ClientesChart,
        faturamentoVendedorChart, canalVendasChart, top10ProdutosChart,
        themeLightButton, themeDarkButton, templateSelect, currentDateSpan,
        loggedUserSpan, uploadButton, fileInput
    ];
    const missingElements = requiredElements.filter(el => el === null);
    if (missingElements.length > 0) {
        console.error("ERRO CRÍTICO: Elementos HTML essenciais não encontrados. Verifique IDs e estrutura HTML.", missingElements);
        alert("Erro na inicialização da página. Abra o console do navegador para detalhes e encontre o elemento 'null'.");
        return;
    }


    // 2. Adiciona Event Listeners
    uploadButton.addEventListener('click', handleUpload);
    themeLightButton.addEventListener('click', () => setTheme('light'));
    themeDarkButton.addEventListener('click', () => setTheme('dark'));
    templateSelect.addEventListener('change', (e) => {
        currentDashboardTemplate = e.target.value;
        if (rawData.length > 0) {
            filterDataAndRender();
        }
    });

    // 3. Define o estado inicial da UI
    uploadSection.style.display = 'block';
    dashboardContainer.style.display = 'none';

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


// Handler para o upload da planilha
async function handleUpload() {
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione uma planilha para enviar.');
        return;
    }

    uploadSection.style.display = 'none';
    dashboardContainer.style.display = 'grid';

    dashboardTitle.textContent = 'Analisando dados...';

    const allChartSpecificContainers = [
        faturamentoMensalChart, top10ClientesChart, faturamentoVendedorChart,
        canalVendasChart, top10ProdutosChart
    ];
    allChartSpecificContainers.forEach(container => {
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    });
    kpiAreaMain.innerHTML = '';
    kpiAreaMain.style.display = 'grid';
    kpiQuantidade.innerHTML = '';
    kpiQuantidade.style.display = 'none';

    sidebarFilterArea.innerHTML = '';


    const formData = new FormData();
    formData.append('spreadsheet', file);

    try {
        const response = await fetch('http://localhost:3000/api/analyze-data', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Erro na comunicação com o servidor.');
        }

        const result = await response.json();

        if (result.success) {
            dashboardTitle.textContent = 'Dashboard Acompanhamento de Vendas';
            rawData = result.data;
            if (rawData.length > 0) {
                buildDashboard(rawData, currentDashboardTemplate);
                buildFilterUI(rawData);
            } else {
                dashboardTitle.textContent = 'Atenção';
                uploadSection.style.display = 'block';
                dashboardContainer.style.display = 'none';
                alert('A planilha está vazia ou não contém dados válidos.');
            }
        } else {
            dashboardTitle.textContent = 'Erro ao gerar o dashboard';
            uploadSection.style.display = 'block';
            dashboardContainer.style.display = 'none';
            alert(`Erro do servidor: ${result.error}`);
        }
    } catch (error) {
        console.error('Erro:', error);
        dashboardTitle.textContent = 'Erro ao gerar o dashboard';
        uploadSection.style.display = 'block';
        dashboardContainer.style.display = 'none';
        alert(`Ocorreu um erro: ${error.message}. Por favor, tente novamente.`);
    }
}


function buildDashboard(data, templateName) {
    const allChartSpecificContainers = [
        faturamentoMensalChart, top10ClientesChart, faturamentoVendedorChart,
        canalVendasChart, top10ProdutosChart
    ];
    allChartSpecificContainers.forEach(container => {
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    });
    kpiAreaMain.innerHTML = '';
    kpiAreaMain.style.display = 'grid';
    kpiQuantidade.innerHTML = '';
    kpiQuantidade.style.display = 'none';


    const {
        allCharts,
        allKpis,
        columnTypes
    } = analyzeAndCreateDashboardItems(data);
    const selectedTemplate = dashboardTemplates[templateName];

    if (selectedTemplate.kpis && selectedTemplate.kpis.length > 0) {
        selectedTemplate.kpis.forEach(kpiDefGroup => {
            if (kpiDefGroup.id === 'kpi-area-main' && kpiDefGroup.items) {
                const targetKpiArea = kpiAreaMain;
                if (targetKpiArea) {
                    kpiDefGroup.items.forEach(itemDef => {
                        const matchingKpi = allKpis.find(k => k.column === itemDef.column);
                        if (matchingKpi) {
                            const kpiCard = document.createElement('div');
                            kpiCard.classList.add('kpi-card');
                            kpiCard.style.display = 'flex';
                            kpiCard.innerHTML = `
                                <h4>${itemDef.title}</h4>
                                <p style="color:${itemDef.color || '#007bff'};">${matchingKpi.value}</p>
                            `;
                            targetKpiArea.appendChild(kpiCard);
                        } else {
                            const kpiCard = document.createElement('div');
                            kpiCard.classList.add('kpi-card');
                            kpiCard.style.display = 'flex';
                            kpiCard.innerHTML = `<h4>${itemDef.title}</h4><p>N/D</p>`;
                            targetKpiArea.appendChild(kpiCard);
                        }
                    });
                }
            } else if (kpiDefGroup.id && kpiDefGroup.item && kpiDefGroup.id === selectedTemplate.mainKpiId) {
                const matchingKpi = allKpis.find(k => k.column === kpiDefGroup.item.column);
                const targetKpiCard = kpiQuantidade;
                if (targetKpiCard) {
                    targetKpiCard.style.display = 'flex';
                    if (matchingKpi) {
                        targetKpiCard.innerHTML = `
                            <h4>${kpiDefGroup.item.title}</h4>
                            <p style="color:${kpiDefGroup.item.color || '#007bff'};">${matchingKpi.value}</p>
                        `;
                    } else {
                        targetKpiCard.innerHTML = `<h4>${kpiDefGroup.item.title}</h4><p>N/D</p>`;
                    }
                }
            }
        });
    }

    if (selectedTemplate.charts && selectedTemplate.charts.length > 0) {
        selectedTemplate.charts.forEach(chartDef => {
            const matchingChart = allCharts.find(chart =>
                chart.labelColumn === chartDef.labelColumn &&
                chart.valueColumn === chartDef.valueColumn &&
                chart.type === chartDef.type
            );

            if (matchingChart) {
                const targetChartContainer = document.getElementById(chartDef.id);
                if (targetChartContainer) {
                    targetChartContainer.style.display = 'block';
                    renderSingleChart(targetChartContainer, matchingChart);
                } else {
                    console.warn(`Container para o gráfico ${chartDef.id} não encontrado no HTML.`);
                }
            }
            // Não adiciona placeholder se o chartContainer não existe.
        });
    }
}

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
        const isNumeric = data.every(row => {
            const value = row[column];
            return !isNaN(parseFloat(value)) || value === null || value === undefined || value === '';
        });

        const isDate = data.every(row => {
            const value = row[column];
            if (value === null || value === undefined || value === '') return true;
            if (typeof value === 'string' && !isNaN(new Date(value)) && !/^\s*[+-]?\d+(\.\d+)?\s*$/.test(value)) return true;
            if (typeof value === 'number' && value > 25569 && value < 2958466) return true;
            return false;
        });

        if (isDate) {
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

        const totalFormatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(total);
        kpis.push({
            title: column,
            column: column,
            value: totalFormatted,
            totalValue: total,
            count: validCount
        });

        if (validCount > 0) {
            const average = total / validCount;
            const averageFormatted = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(average);
            kpis.push({
                title: `Média de ${column}`,
                column: `Média de ${column}`,
                value: averageFormatted,
            });
        }
    });

    charts.sort((a, b) => {
        if (a.chartType === 'line' && b.chartType !== 'line') return -1;
        if (a.chartType !== 'line' && b.chartType === 'line') return 1;
        return 0;
    });

    return {
        allCharts: charts,
        allKpis: kpis,
        columnTypes: columnTypes
    };
}

function createChartObject(data, labelColumn, valueColumn, suggestedType) {
    const aggregatedData = {};
    data.forEach(row => {
        let label = row[labelColumn];
        const value = parseFloat(row[valueColumn]);

        if (suggestedType === 'line' && typeof label === 'number' && label > 25569 && label < 2958466) {
            const excelDate = new Date(Math.round((label - 25569) * 86400 * 1000));
            label = excelDate.toLocaleDateString('pt-BR');
        } else if (label === null || label === undefined || label === '') {
            label = "N/A";
        }

        if (label && !isNaN(value)) {
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

function renderSingleChart(containerElement, chartData) {
    const existingChart = Chart.getChart(containerElement.querySelector('canvas'));
    if (existingChart) {
        existingChart.destroy();
    }

    containerElement.innerHTML = '';

    const chartTitle = document.createElement('h3');
    chartTitle.textContent = chartData.title;
    containerElement.appendChild(chartTitle);

    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    const isDarkMode = document.body.classList.contains('theme-dark');
    const defaultChartColor = isDarkMode ? 'rgba(123, 153, 194, 0.8)' : 'rgba(75, 192, 192, 0.6)';
    const defaultBorderColor = isDarkMode ? 'rgba(123, 153, 194, 1)' : 'rgba(75, 192, 194, 1)';
    const fontColor = isDarkMode ? '#f4f7fa' : '#333';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    new Chart(canvas, {
        type: chartData.chartType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.title,
                data: chartData.data,
                fill: chartData.chartType === 'line' ? true : false,
                backgroundColor: chartData.chartType === 'pie' ? getPieChartColors(chartData.labels.length) : defaultChartColor,
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
                }
            }
        }
    });
}

function buildFilterUI(data) {
    const filterArea = sidebarFilterArea;
    filterArea.innerHTML = '';
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const filterableColumns = columns.filter(column => {
        const valueSample = data[0][column];
        const isNumericButNotDate = !isNaN(parseFloat(valueSample)) && !(typeof valueSample === 'number' && valueSample > 25569 && valueSample < 2958466);
        return !isNumericButNotDate;
    });

    filterableColumns.forEach(column => {
        const uniqueValues = [...new Set(data.map(item => {
            let value = item[column];
            if (typeof value === 'number' && value > 25569 && value < 2958466) {
                const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
                return excelDate.toLocaleDateString('pt-BR');
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
            if (value !== undefined && value !== null && value !== 'N/A' && value !== '') {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            }
        });

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
                } else {
                    rowValue = String(rowValue);
                }
                return rowValue === String(filterValue);
            });
        }
    });

    buildDashboard(filteredData, currentDashboardTemplate);
}

function getPieChartColors(count) {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#f3a683', '#7efff5', '#575fcf', '#4bcffa', '#a55eea'];
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('theme', themeName);
    if (rawData.length > 0) {
        buildDashboard(rawData, currentDashboardTemplate);
    }
}