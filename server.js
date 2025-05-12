const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta web-dashboard
app.use(express.static(path.join(__dirname, 'web-dashboard')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-dashboard', 'index.html'));
});

// Porta padrão do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 