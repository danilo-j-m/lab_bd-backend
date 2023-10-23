/* API REST dos Prestadores */

import express from 'express';
import { connectToDatabase } from '../utils/mongodb.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();
const { db, ObjectId } = await connectToDatabase();
const collection = 'prestadores';

import auth from '../middlewares/auth.js';

const validaPrestador = [
    check('cnpj')
        .not().isEmpty().trim().withMessage('CNPJ é obrigatório.')
        .isNumeric().withMessage('CNPJ deve conter apenas números.')
        .isLength({ min: 14, max: 14 }).withMessage('CNPJ deve conter 14 números.')
    ,
    check('razao_social')
        .not().isEmpty().trim().withMessage('Razão Social é obrigatório.')
        .isAlphanumeric('pt-BR', { ignore: '/. ' }).withMessage('Não deve ter caracteres especiais.')
        .isLength({ min: 5 }).withMessage('Razão deve ter no mínimo 5 caracteres.')
        .isLength({ max: 200 }).withMessage('Razão deve ter no máximo 100 caracteres.')
    ,
    check('cnae_fiscal')
        .isNumeric().withMessage('CNAE Fiscal deve ser um número')
    ,
    check('nome_fantasia')
        .optional({ nullable: true })
    ,
];


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
    GET /api/prestadores/:id
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

/*
    GET /api/prestadores/razao/:razao
    Procura um prestador pela Razão Social
*/
router.get('/razao/:razao', async (req, res) => {
    try {
        db.collection(collection)
        .find({ razao_social: { $regex: req.params.razao, $options: 'i' } })
        .toArray((err, docs) => {
            if (err) return res.status(400).json(err);
            else return res.status(200).json(docs);
        });
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

/*
    DELETE api/prestadores/id
    Exclui um prestador por ID
*/
router.delete('/:id', auth, async (req, res) => {
    await
        db.collection(collection)
        .deleteOne({ _id: { $eq: ObjectId(req.params.id) } })
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    ;
});

/*
    POST api/prestadores
    Insere um novo prestador
*/
router.post('/', auth, validaPrestador, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    else {
        await
            db.collection(collection)
            .insertOne(req.body)
            .then(result => res.status(201).send(result))
            .catch(err => res.status(400).json(err))
        ;
    }
});

/*
    PUT api/prestadores/id
    Altera um prestador pelo ID
*/
router.put('/', auth, validaPrestador, async (req, res) => {
    const id = req.body._id; // armazena id do documento
    delete req.body._id;     // exclui o id do documento do body

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    else {
        await
            db.collection(collection)
            .updateOne({ _id: { $eq: ObjectId(id) } }, { $set: req.body })
            .then(result => res.status(200).send(result))
            .catch(err => res.status(400).json(err))
        ;
    }
});

export default router;