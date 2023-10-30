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

/**
 *  POST /usuarios
 *  Realiza cadastro de um novo usuário
 */

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

const validaLogin = [
    check('email')
        .not().isEmpty().withMessage('O e-mail é obrigatório.')
        .isEmail().withMessage('Insira um e-mail válido')
    ,
    check('senha')
        .not().isEmpty().withMessage('Senha é obrigatória.')
        .isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres.')
    ,
];

/**
 *  POST /usuarios/login
 *  Efetua o login do usuário e retorna o token JWT
 */

router.post('/login', validaLogin, async (req, res) => {
    const schemaErrors = validationResult(req)

    if (!schemaErrors.isEmpty()) {
        return res.status(403).json({ errors: schemaErrors.array() });
    }

    const { email, senha }= req.body;

    try {
        const usuario = await collection.find({ 'email': email }).toArray();

        if (!usuario[0]) {
            return res.status(404).json({
                errors: [{
                    value: email,
                    msg: 'O e-mail informado não está cadastrado.',
                    param: 'email'
                }]
            });
        }

        const isMatch = await bcrypt.compare(senha, usuario[0].senha);

        if (!isMatch) {
            return res.status(403).json({
                errors: [{
                    value: 'senha',
                    msg: 'A senha informada está incorreta.',
                    param: 'senha'
                }]
            });
        }

        jwt.sign(
            { usuario: { id: usuario[0]._id } },
            process.env.SECRET_KEY,
            { expiresIn: process.env.EXPIRES_IN },
            (err, token) => {
                if (err) throw err;

                return res.status(200).json({
                    access_token: token
                });
            }
        );
    }
    catch (err) {
        console.error(err);
    }
});

/**
 *  GET /usuarios
 *  Lista todos os usuários. Autenticação necessária (Token JWT)
 */

router.get('/', auth, async (req, res) => {
    try {
        collection
            .find({}, { projection: { senha: false } })
            .sort({ nome: 1 })
            .toArray((err, docs) => {
                if (!err) {
                    return res.status(200).json(docs);
                }
            })
        ;
    }
    catch (err) {
        return res.status(500).json({
            errors: [{
                message: 'Erro ao obter a listagem de usuários.'
            }]
        });
    }
});

/**
 *  DELETE /usuarios/id
 *  Remove um usuário pelo ID. Autenticação necessária (Token JWT)
 */

router.delete('/:id', auth, async (req, res) => {
    await collection
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        .then(result => res.status(202).send(result))
        .catch(err => res.status(400).json(err))
    ;
});

/**
 *  PUT /usuarios/id
 *  Update de usuário pelo ID. Autenticação necessária (Token JWT)
 */

router.put('/:id', auth, validaUsuario, async (req, res) => {
    const schemaErrors = validationResult(req);

    if (!schemaErrors.isEmpty()) {
        return res.status(403).json({ errors: schemaErrors.array() })
    }

    await collection
        .updateOne({ '_id': { $eq: ObjectId(req.params.id) } }, { $set: req.body })
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    ;
});

export default router;