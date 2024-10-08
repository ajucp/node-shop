const express=require('express');
const path=require('path');

const routes=express.Router();
const shopControllers=require("../controllers/shop");//creating the path of the controller and give that into new variabale
const { route } = require('./admin');
const isAuth=require('../middleware/is-auth')

routes.get("/",shopControllers.getIndex);//caling the funtion from the controller logic we have created in products.js 

//creating the router for the nav bar items
routes.get('/products',shopControllers.getProducts);

routes.get('/product/:productId',shopControllers.getProduct);

routes.get('/cart',isAuth,shopControllers.getCart);

routes.post('/cart',isAuth,shopControllers.postCart);

routes.post('/cart-delete-item',isAuth, shopControllers.postDeleteCartProduct);

// routes.post('/create-order',isAuth,shopControllers.postOrder);




routes.get('/checkout',isAuth,shopControllers.getCheckout);
routes.get('/checkout/success',isAuth,shopControllers.postOrder);//we can do with checkorder by creating a new routes or same
routes.get('/checkout/cancel',isAuth,shopControllers.getCheckout);
routes.get('/orders',isAuth,shopControllers.getOrders);

routes.get('/orders/:orderId',isAuth,shopControllers.getInvoice);




module.exports=routes;