const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 1987;

// Mapear as moedas para os códigos
const currencyCodes = {
    'CNY': 178,
	//'GBP': 115,
    // Adicione outros códigos de moeda aqui
    // 'USD': <codigo>,
    // 'EUR': <codigo>,
};

app.get('/cotacao/PTAX/:moeda', async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    const { moeda } = req.params;

    if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'Por favor, forneça as datas de início e fim no formato dd/mm/yyyy.' });
    }

    const moedaCodigo = currencyCodes[moeda.toUpperCase()];
    if (!moedaCodigo) {
        return res.status(400).json({ error: 'Código de moeda inválido.' });
    }

    const url = `https://ptax.bcb.gov.br/ptax_internet/consultaBoletim.do?method=gerarCSVFechamentoMoedaNoPeriodo&ChkMoeda=${moedaCodigo}&DATAINI=${dataInicio}&DATAFIM=${dataFim}`;
	//const url = `https://www4.bcb.gov.br/Download/fechamento/20240516.csv`;
    try {
        const response = await axios.get(url);
        const csvData = response.data;

        const results = [];
        csvData.split('\n').forEach(row => {
            const columns = row.split(';');
            if (columns.length >= 8) {
                results.push({
                    data: columns[0],
                    codigoMoeda: columns[1],
                    tipoMoeda: columns[2],
                    simboloMoeda: columns[3],
                    taxaCompra: columns[4],
                    taxaVenda: columns[5],
                    paridadeCompra: columns[6],
                    paridadeVenda: columns[7]
                });
            }
        });

        if (results.length > 0) {
            const ultimaCotacao = results[results.length - 1];
            res.json({
                data: ultimaCotacao.data,
                taxaCompra: ultimaCotacao.taxaCompra,
                taxaVenda: ultimaCotacao.taxaVenda
            });
        } else {
            res.status(404).json({ error: 'Nenhuma cotação encontrada para o período fornecido.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter os dados da cotação.' });
    }
});

app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});