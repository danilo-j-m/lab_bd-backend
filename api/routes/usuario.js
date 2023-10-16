import express from 'express';
import { connectToDatabase } from '../utils/mongodb.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();
const { db, ObjectId } = await connectToDatabase();
const collection = db.collection('usuarios');

import auth from '../middlewares/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const validaUsuario = [
    check('nome')
        .not().isEmpty().trim().withMessage('Nome é obrigatório.')
        .isAlpha('pt-BR', { ignore: ' ' }).withMessage('Informe apenas texto no nome.')
        .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres.')
        .isLength({ max: 100 }).withMessage('Nome deve ter no máximo 100 caracteres.')
    ,
    check('email')
        .not().isEmpty().trim().withMessage('E-mail é obrigatório.')
        .isLowercase().withMessage('E-mail não pode ser MAIÚSCULO.')
        .isEmail().withMessage('E-mail deve ser válido.')
        .custom((value, { req }) => {
            return collection.find({ email: { $eq: value } })
                .toArray()
                .then((email) => {
                    if (email.length && !req.params.id) {
                        return Promise.reject(`O e-mail ${value} já existe`);
                    }
                })
            ;
        })
    ,
    check('senha')
        .not().isEmpty().trim().withMessage('Senha é obrigatória.')
        .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.')
        .isStrongPassword({
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        }).withMessage('Informe uma senha contendo letras minúsculas e maiúsculas, caracteres especiais e números.')
    ,
    check('ativo')
        .default(true)
        .isBoolean().withMessage('O valor deve ser booleano.')
    ,
    check('tipo')
        .default('Cliente')
        .isIn(['Admin', 'Cliente']).withMessage('Tipo deve ser Admin ou Cliente')
    ,
    check('avatar')
        .isURL().withMessage('Endereço do avatar deve ser uma URL válida.')
    ,
];

router.post('/', validaUsuario, async(req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const formattedName = req.body.nome.replace(' ', '+'); 
    req.body.avatar = `https://ui-avatars.com/api/?name=${formattedName}`;

    const salt = await bcrypt.genSalt(10);
    req.body.senha = await bcrypt.hash(req.body.senha, salt);

    collection
        .insertOne(req.body)
        .then(result => res.status(201).send(result))
        .catch(err => res.status(400).json(err))
    ;
});

export default router;