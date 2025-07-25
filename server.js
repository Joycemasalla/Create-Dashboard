const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
});

app.post('/api/analyze-data', upload.single('spreadsheet'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Nenhum arquivo foi enviado.'
            });
        }

        const file = req.file;
        let workbook;

        // Detecta o tipo de arquivo pela extensão ou MIME type
        const fileName = file.originalname || '';
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension === 'csv' || file.mimetype === 'text/csv') {
            // Para CSV, o xlsx.read espera uma string
            const csvString = file.buffer.toString('utf8');
            workbook = xlsx.read(csvString, {
                type: 'string'
            });
        } else if (['xlsx', 'xls'].includes(fileExtension) || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
            // Para Excel, o xlsx.read espera um buffer
            workbook = xlsx.read(file.buffer, {
                type: 'buffer'
            });
        } else {
            return res.status(400).json({
                error: 'Formato de arquivo não suportado. Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV (.csv).'
            });
        }


        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, {
            header: 1
        });

        // Verifica se há dados além dos cabeçalhos
        if (jsonData.length < 1 || (jsonData.length === 1 && jsonData[0].every(cell => cell === null || cell === ''))) {
            return res.status(400).json({
                error: 'A planilha está vazia ou não contém dados válidos.'
            });
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        const formattedData = rows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        const {
            charts,
            kpis
        } = analyzeData(formattedData);
        res.json({
            success: true,
            data: formattedData,
            charts,
            kpis
        });

    } catch (error) {
        console.error('Erro ao processar a planilha:', error);
        res.status(500).json({
            success: false,
            error: 'Ocorreu um erro interno no servidor.'
        });
    }
});

function analyzeData(data) {
    const charts = [];
    const kpis = [];
    if (data.length === 0) return {
        charts,
        kpis
    };

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
            return !value || !isNaN(new Date(value)) || (typeof value === 'number' && value > 25569);
        });

        if (isNumeric && !isDate) {
            numericColumns.push(column);
        } else if (isDate) {
            dateColumns.push(column);
        } else {
            categoricalColumns.push(column);
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
        data.forEach(row => {
            const value = parseFloat(row[column]);
            if (!isNaN(value)) {
                total += value;
            }
        });

        const totalFormatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(total);

        kpis.push({
            title: `Total de ${column}`,
            value: totalFormatted,
            icon: '💰'
        });
    });

    return {
        charts,
        kpis
    };
}

function createChartObject(data, labelColumn, valueColumn, suggestedType) {
    const aggregatedData = {};
    data.forEach(row => {
        const label = row[labelColumn];
        const value = parseFloat(row[valueColumn]);
        if (label && !isNaN(value)) {
            if (aggregatedData[label]) {
                aggregatedData[label] += value;
            } else {
                aggregatedData[label] = value;
            }
        }
    });

    const aggregatedLabels = Object.keys(aggregatedData).sort();
    const aggregatedValues = aggregatedLabels.map(label => aggregatedData[label]);

    let chartType = suggestedType;
    if (suggestedType === 'bar' && aggregatedLabels.length < 8) {
        chartType = 'pie';
    }

    return {
        chartType: chartType,
        title: `${valueColumn} por ${labelColumn}`,
        labels: aggregatedLabels,
        data: aggregatedValues
    };
}

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});