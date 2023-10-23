import jwt from 'jsonwebtoken';

export default async function auth(req, res, next) {
    const token = req.header('access-token') || req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({
            message: 'Acesso negado.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        /**
         * decoded:
         *  usuario (payload)
         *  exp (expiration)
         *  iat (issued at)
         */

        req.usuario = await decoded.usuario;

        next(); // Passa para o endpoint
    }
    catch (err) {
        console.error(err.message);

        return res.status(403).send({
            error: `Token inválido: ${err.message}`
        });
    }
}