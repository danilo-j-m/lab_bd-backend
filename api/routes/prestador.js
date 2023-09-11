/* API REST dos Prestadores */

import express from 'express';
import { connectToDatabase } from '../utils/mongodb.js';

const router = express.Router();
const { db, ObjectId } = await connectToDatabase();
const collection = 'prestadores';


/*
    GET /api/prestadores
    Lista todos os prestadores
*/
router.get('/', async (req, res) => {
    try {
        db.collection(collection).find().sort({ razao_social: 1 })
        .toArray((err, docs) => {
            if (!err) return res.status(200).json(docs);
        });
    }
    catch (err) {
        return res.status(500).json({
            errors: [{
                value: err.message,
                message: 'Erro ao listar Prestadores.',
                param: '/'
            }]
        });
    }
});

/*
    GET /api/prestadores/id
    Lista um prestador por ID
*/
router.get('/:id', async (req, res) => {
    try {
        db.collection(collection).find({ _id: { $eq: ObjectId(req.params.id) } })
        .toArray((err, docs) => {
            if (err) return res.status(400).json(err);
            else return res.status(200).json(docs);
        })
    }
    catch (err) {
        return res.status(500).json({
            errors: [{
                value: err.message,
                message: 'Erro ao listar Prestador por ID.',
                param: '/'
            }]
        });
    }
});

export default router;