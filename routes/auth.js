const express = require('express');
const {check,body}=require("express-validator");//check the validator for that import the package

const authController = require('../controllers/auth');
const User=require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login',[
    body('email').isEmail().withMessage('please enter a valid email id').normalizeEmail(),
    body('password','please enter a password with number and text with minumum 5 charcter')
    .isAlphanumeric()
    .isLength({min:5}).trim(),
], authController.postLogin);
router.post('/logout', authController.postLogout);
router.get('/signup', authController.getSignup);
router.post('/signup', 
    [check('email')
        .isEmail()//there are other validator are there check it in the offical page-https://express-validator.github.io/docs/
        .withMessage('please enter a valid email id').normalizeEmail()
        .custom((value,{req})=>{
            // if(value==='test@gmail.com'){
            //     throw new Error('this email address is forbiden')
            // }
            // return true ;
            return User.findOne({email:value})
            .then(userDoc=>{
            if(userDoc){
                return Promise.reject('E-Mail already exist,Please try with another')
                }
            })
        }),
        body('password','please enter a password with number and text with minumum 5 charcter')
        .isAlphanumeric().isLength({min:5}).trim(),
        body('confirmPassword').trim()
        .custom((value,{req})=>{
            if(value !== req.body.password){
                throw new Error('password you have entered is not matching')
            }
            return true
        })
    ],
        authController.postSignup);
router.get('/reset',authController.getReset);
router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword);
router.post('/new-password',authController.postNewPassword);
module.exports = router;