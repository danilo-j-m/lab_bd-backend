import express from "express";

const app = express();
const port = 4000;

// Parse JSON
app.use(express.json());

// Rotas conteúdo Público
app.use('/', express.static('public'));

// Configura Favicon
app.use('/favicon.ico', express.static('public/images/favicon.png'));

// Rotas API
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'API Online',
        version: '1.0.0'
    });
});

// Rotas de Exceção
app.use((req, res) => {
    res.status(404).json({
        errors: [{
            value: `${req.originalUrl}`,
            message: `A rota ${req.originalUrl} não existe nessa API!`,
            param: 'invalid route'
        }]
    });
});

// Inicializa Server
app.listen(port, () => {
    console.log('💻 Servidor rodando na porta: ' + port);
});