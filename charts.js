// charts.js

// Variáveis globais acessíveis a partir de script.js
// allChartsInstances é declarada em script.js e acessada aqui.
// filters é declarada em script.js e acessada aqui (para funções de filtro).
// rawData é declarada em script.js e acessada aqui.
// filterDataAndRender é uma função global definida em script.js

// Função auxiliar para obter o valor de uma variável CSS
function getCssVariable(varName) {
    const value = getComputedStyle(document.body).getPropertyValue(varName).trim();
    return value || ''; 
}

// Fornece uma paleta de cores consistente para gráficos
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

    const colorVarsToUse = isDarkMode ? darkColors : lightColors; 
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(getCssVariable(colorVarsToUse[i % colorVarsToUse.length]));
    }

    if (result.length === 0) { 
        return [getCssVariable(isDarkMode ? '--primary-color' : '--primary-color')];
    }
    
    if (type === 'bar' || type === 'line') {
        if (count > 1) { 
            return result;
        }
        return [getCssVariable(colorVarsToUse[0])]; 
    }

    return result; 
}

// analyzeAndCreateDashboardItems: Analisa os dados e sugere KPIs, Gráficos e Insights
function analyzeAndCreateDashboardItems(data) {
    if (data.length === 0) return {
        allCharts: [],
        allKpis: [],
        columnTypes: {},
        insights: []
    };

    const charts = [];
    const kpis = [];
    const insights = []; // Array para armazenar os insights gerados
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
        let min = Infinity;
        let maxCategory = '';
        let minCategory = '';

        data.forEach(row => {
            const value = parseFloat(row[column]);
            if (!isNaN(value)) {
                total += value;
                validCount++;
                if (value > max) {
                    max = value;
                    const productColumn = categoricalColumns.find(col => col.toLowerCase().includes('produto') || col.toLowerCase().includes('nome.cliente') || col.toLowerCase().includes('item'));
                    if (productColumn && row[productColumn]) {
                        maxCategory = row[productColumn];
                    }
                }
                if (value < min) {
                    min = value;
                    const productColumn = categoricalColumns.find(col => col.toLowerCase().includes('produto') || col.toLowerCase().includes('nome.cliente') || col.toLowerCase().includes('item'));
                    if (productColumn && row[productColumn]) {
                        minCategory = row[productColumn];
                    }
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
                color: 'var(--success-color)',
                icon: 'fas fa-dollar-sign'
            });

            const average = total / validCount;
            kpis.push({
                title: `Média de ${column}`,
                column: column,
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(average),
                type: 'average',
                color: 'var(--info-color)',
                icon: 'fas fa-chart-line'
            });

            if (isFinite(max)) {
                kpis.push({
                    title: `Máximo de ${column}`,
                    column: column,
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(max),
                    type: 'max',
                    color: 'var(--warning-color)',
                    icon: 'fas fa-arrow-alt-circle-up'
                });
            }
            if (isFinite(min)) {
                kpis.push({
                    title: `Mínimo de ${column}`,
                    column: column,
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(min),
                    type: 'min',
                    color: 'var(--danger-color)',
                    icon: 'fas fa-arrow-alt-circle-down'
                });
            }

            if (isFinite(max) && maxCategory) {
                insights.push({
                    icon: 'fas fa-award',
                    text: `O maior valor de ${column} foi ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(max)} em "${maxCategory}".`
                });
            }
            if (isFinite(min) && minCategory) {
                insights.push({
                    icon: 'fas fa-caret-down',
                    text: `O menor valor de ${column} foi ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(min)} em "${minCategory}".`
                });
            }
        }
    });

    const generatedChartCombinations = new Set(); 

    const relevantDateColumns = ['Data', 'DATA DE CARREGAMENTO', 'Data do Pedido', 'Data de Expedição'].filter(col => dateColumns.includes(col));
    
    if (relevantDateColumns.length > 0) {
        relevantDateColumns.forEach(labelCol => {
            numericColumns.forEach(valueCol => {
                const combination = `${labelCol}-${valueCol}-line`;
                if (!generatedChartCombinations.has(combination)) {
                    charts.push(createChartObject(data, labelCol, valueCol, 'line'));
                    generatedChartCombinations.add(combination);
                }
            });
        });
    } else if (dateColumns.length > 0) { 
        const firstDateColumn = dateColumns[0];
        numericColumns.forEach(valueCol => {
            const combination = `${firstDateColumn}-${valueCol}-line`;
            if (!generatedChartCombinations.has(combination)) {
                charts.push(createChartObject(data, firstDateColumn, valueCol, 'line'));
                generatedChartCombinations.add(combination);
            }
        });
    }

    const importantCategoricalColumns = ['RESP.CARREG', 'MOTORISTA', 'ESTADO', 'NOME.CLIENTE', 'FORMA DE ENVIO', 'PRODUTO', 'ITEM'].filter(col => categoricalColumns.includes(col)); // Adicionado 'ITEM'
    const MAX_CATEGORIES_FOR_PIE = 10; 
    const MAX_CATEGORIES_FOR_BAR = 25; 

    importantCategoricalColumns.forEach(labelCol => {
        const uniqueValuesCount = new Set(data.map(row => row[labelCol])).size;
        if (uniqueValuesCount > MAX_CATEGORIES_FOR_BAR) {
            console.warn(`Coluna '${labelCol}' tem muitas categorias (${uniqueValuesCount}). Um gráfico não será gerado automaticamente para evitar confusão.`);
            return; 
        }

        numericColumns.forEach(valueCol => {
            let chartType = 'bar'; 
            if (uniqueValuesCount <= MAX_CATEGORIES_FOR_PIE && uniqueValuesCount > 1) {
                chartType = 'pie'; 
            }
            
            const combination = `${labelCol}-${valueCol}-${chartType}`;
            if (!generatedChartCombinations.has(combination)) {
                charts.push(createChartObject(data, labelCol, valueCol, chartType));
                generatedChartCombinations.add(combination);

                if (chartType === 'bar' || chartType === 'pie') {
                    const aggregatedValues = {};
                    data.forEach(row => {
                        const cat = String(row[labelCol]);
                        const val = parseFloat(row[valueCol]);
                        if (!isNaN(val)) {
                            aggregatedValues[cat] = (aggregatedValues[cat] || 0) + val;
                        }
                    });
                    const sortedCategories = Object.entries(aggregatedValues).sort((a, b) => b[1] - a[1]);
                    if (sortedCategories.length > 0) {
                        const topCategory = sortedCategories[0];
                        if (topCategory[1] > 0) { 
                            insights.push({
                                icon: 'fas fa-trophy',
                                text: `A categoria de ${labelCol} com maior ${valueCol} é "${topCategory[0]}", totalizando ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topCategory[1])}.`
                            });
                        }
                    }
                }
            }
        });
    });

    if (importantCategoricalColumns.length === 0) {
        categoricalColumns.forEach(labelCol => {
            const uniqueValuesCount = new Set(data.map(row => row[labelCol]).filter(val => val !== "N/A")).size; 
            if (uniqueValuesCount > MAX_CATEGORIES_FOR_BAR) {
                console.warn(`Coluna categórica genérica '${labelCol}' tem muitas categorias (${uniqueValuesCount}). Um gráfico não será gerado automaticamente para evitar confusão.`);
                return;
            }

            numericColumns.forEach(valueCol => {
                let chartType = 'bar';
                if (uniqueValuesCount <= MAX_CATEGORIES_FOR_PIE && uniqueValuesCount > 1) {
                    chartType = 'pie';
                }
                const combination = `${labelCol}-${valueCol}-${chartType}`;
                if (!generatedChartCombinations.has(combination)) {
                    charts.push(createChartObject(data, labelCol, valueCol, chartType));
                    generatedChartCombinations.add(combination);
                }
            });
        });
    }

    charts.sort((a, b) => {
        if (a.chartType === 'line' && b.chartType !== 'line') return -1;
        if (a.chartType !== 'line' && b.chartType === 'line') return 1;
        return a.title.localeCompare(b.title);
    });

    return {
        allCharts: charts,
        allKpis: kpis,
        columnTypes: columnTypes,
        insights: insights 
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

    let chartTooltipText = `Este gráfico exibe "${valueColumn}" agrupado por "${labelColumn}". `;
    if (chartType === 'line') chartTooltipText += `Ideal para analisar tendências ao longo do tempo.`;
    else if (chartType === 'bar') chartTooltipText += `Utilize para comparar valores entre diferentes categorias.`;
    else if (chartType === 'pie') chartTooltipText += `Mostra a proporção de cada categoria em relação ao total.`;


    return {
        chartType: chartType,
        title: `${valueColumn} por ${labelColumn}`,
        labels: aggregatedLabels,
        data: aggregatedValues,
        labelColumn: labelColumn,
        valueColumn: valueColumn,
        type: suggestedType,
        tooltipText: chartTooltipText 
    };
}

// renderSingleChart: Renderiza um único gráfico usando Chart.js
function renderSingleChart(containerElement, chartData, chartId) {
    if (allChartsInstances[chartId]) {
        allChartsInstances[chartId].destroy();
    }

    containerElement.innerHTML = '';

    const chartTitleContainer = document.createElement('div'); // Contêiner para título e ícone de ajuda
    chartTitleContainer.style.display = 'flex';
    chartTitleContainer.style.alignItems = 'center';
    chartTitleContainer.style.justifyContent = 'center';
    chartTitleContainer.style.width = '100%';
    chartTitleContainer.style.gap = '10px';


    const chartTitle = document.createElement('h3');
    chartTitle.textContent = chartData.title;
    chartTitleContainer.appendChild(chartTitle);

    // Ícone de ajuda (Tooltip)
    const tooltipIconContainer = document.createElement('span');
    tooltipIconContainer.classList.add('chart-tooltip-icon');
    tooltipIconContainer.innerHTML = `<i class="fas fa-info-circle"></i>`; // Ícone de informação
    
    const tooltipBox = document.createElement('div');
    tooltipBox.classList.add('chart-tooltip-box');
    tooltipBox.textContent = chartData.tooltipText || 'Informação sobre este gráfico.';
    tooltipIconContainer.appendChild(tooltipBox); // Adiciona a caixa de tooltip dentro do ícone
    
    chartTitleContainer.appendChild(tooltipIconContainer); // Adiciona o ícone ao contêiner do título
    containerElement.appendChild(chartTitleContainer); // Adiciona o contêiner do título ao elemento principal do gráfico


    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    const isDarkMode = document.body.classList.contains('theme-dark');
    
    const fontColor = getCssVariable(isDarkMode ? '--dark-text' : '--light-text');
    const gridColor = getCssVariable(isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
    const cardBgColor = getCssVariable(isDarkMode ? '--dark-card-bg' : '--light-card-bg');

    const ctx = canvas.getContext('2d');
    const chartJsType = chartData.chartType === 'pie' ? 'doughnut' : chartData.chartType; 

    let datasets = [];

    if (chartJsType === 'doughnut') {
        datasets.push({
            label: chartData.title,
            data: chartData.data,
            backgroundColor: getChartColors(chartData.labels.length, isDarkMode, chartJsType),
            borderColor: cardBgColor,
            borderWidth: 2
        });
    } else { // Para gráficos de barra ou linha
        const backgroundColors = getChartColors(chartData.labels.length, isDarkMode, chartJsType);
        const borderColors = backgroundColors; 

        datasets.push({
            label: chartData.title, 
            data: chartData.data,
            fill: chartJsType === 'line' ? true : false,
            backgroundColor: backgroundColors, 
            borderColor: borderColors, 
            borderWidth: 1,
            tension: chartJsType === 'line' ? 0.4 : 0,
            pointRadius: chartJsType === 'line' ? 3 : 0,
            pointBackgroundColor: chartJsType === 'line' ? backgroundColors : 'transparent',
            pointBorderColor: cardBgColor,
            pointBorderWidth: 1,
        });
    }


    const newChart = new Chart(ctx, {
        type: chartJsType,
        data: {
            labels: chartData.labels, 
            datasets: datasets 
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
                        color: fontColor,
                        padding: 5, 
                        callback: function(value) {
                            // CORREÇÃO: Usar Intl.NumberFormat para garantir quebras e formato compacto
                            const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', compactDisplay: 'short' });
                            let formattedValue = formatter.format(value);

                            // Ajuste manual para quebras de linha se o valor ainda for muito longo
                            if (formattedValue.length > 8 && Math.abs(value) < 1000) { // Ex: "R$ 1234,56" pode ser cortado
                                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value); // Sem decimais se for longo
                            }
                            return formattedValue;
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            size: 12 
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    type: 'category',
                    ticks: {
                        color: fontColor,
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0,
                        padding: 5, 
                        font: {
                            size: 12 
                        },
                        callback: function(value, index, values) {
                            const label = this.getLabelForValue(value);
                            const maxLength = 15; 
                            if (label.length > maxLength) {
                                return label.substring(0, maxLength) + '...';
                            }
                            return label;
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            } : {},
            plugins: {
                legend: {
                    display: chartJsType === 'doughnut', 
                    labels: {
                        color: fontColor,
                        padding: 15,
                        boxWidth: 20, 
                        font: {
                            size: 12
                        },
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let labelText = context.label || ''; 
                            if (labelText) {
                                labelText += ': ';
                            }
                            let value = context.parsed.y !== undefined ? context.parsed.y : context.parsed.x !== undefined ? context.parsed.x : context.parsed.valueOf();
                            return labelText + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                        }
                    }
                }
            },
            layout: { 
                padding: {
                    left: 15, // Aumenta o padding esquerdo
                    right: 15, // Aumenta o padding direito
                    top: 15,
                    bottom: 15
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const clickedLabel = chartData.labels[firstElement.index]; 
                    const clickedColumn = chartData.labelColumn; 

                    if (filters[clickedColumn] === clickedLabel) {
                        delete filters[clickedColumn];
                        console.log(`Filtro removido: ${clickedColumn} = "${clickedLabel}".`);
                    } else {
                        filters[clickedColumn] = clickedLabel;
                        console.log(`Filtro aplicado: ${clickedColumn} = "${clickedLabel}".`);
                    }
                    console.log('Filtros atuais:', filters);
                    filterDataAndRender();
                }
            }
        }
    });
    allChartsInstances[chartId] = newChart;
}