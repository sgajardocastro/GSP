const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const router = express.Router();

router.post('/login', 
  [
    body('username').isLength({ min: 4 }).withMessage('El nombre de usuario debe tener al menos 4 caracteres'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  AuthController.login
);
router.post("/login-google", AuthController.loginGoogle);
router.post('/login-email', AuthController.loginPorEmail);
router.post('/login-email-interno', AuthController.loginPorEmailInterno);
router.post('/users/email', AuthController.getUserByEmail);

module.exports = router;
