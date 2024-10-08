const express=require('express');
const path=require('path');
const routes=express.Router();

const {body}=require('express-validator')

const adminControllers=require('../controllers/admin');
const isAuth=require('../middleware/is-auth')


routes.get('/add-product',isAuth,adminControllers.getAddproducts);

routes.get('/products',isAuth,adminControllers.getProducts);

routes.post('/add-product', [
    body('title').isString().isLength({ min: 3 }).trim(),
    // body('title').isString().isLength({ min: 3 }).withMessage('Title is too short!'),
    body('price').isFloat().withMessage('Please enter a valid price'),
    body('description').isLength({ min: 5, max:400 }).trim()
    // body('description').isLength({ min: 5 }).withMessage('Description must be at least 5 characters long')
],isAuth,adminControllers.postAddproducts);
routes.get('/edit-product/:productId',isAuth,adminControllers.getEditProduct);

routes.post('/edit-product', [
    body('title').isString().isLength({ min: 3 }).trim(),
    body('price').isFloat().withMessage('Please enter a valid price'),
    // body('imageUrl').isURL().withMessage('Please enter a valid URL for the image'),
    body('description').isLength({ min: 5, max:400 }).trim()
    // .withMessage('Description must be at least 5 characters long')
]
,isAuth,adminControllers.postEditProducts);



// routes.post('/delete-product',isAuth,adminControllers.postDeleteProduct);//insted of usimg the post delete we are using delete method
routes.delete('/products/:productId',isAuth,adminControllers.deleteProduct)

module.exports=routes;      
