const fs=require('fs');
const path=require('path');
const pdfDocument=require('pdfkit');
const stripe=require('stripe')(process.env.STRIPE_KEY);//install stripe for giving the permission also need to pass the private stripe key its only for the devprs

const Product=require("../models/product");
const Order=require("../models/order");


const ITEMS_PER_PAGE=2;


exports.getProducts=(req,res,next)=>{ 
    const page=+req.query.page ||1;
    let totalItems;
    Product.find().countDocuments()
    .then(numProduct=>{
        totalItems=numProduct;
        return Product.find()
            .skip((page-1)*ITEMS_PER_PAGE)//skiping the previous page
            .limit(ITEMS_PER_PAGE) //limitting the page according to the items per page
            .then((products)=>{
                res.render('shop/product-list', {          //which file to render
                prod: products,
                pageTitle: 'Products',
                path: '/products' ,          
                currentPage:page,
                hasNextPage:ITEMS_PER_PAGE*page<totalItems,
                hasPreviousPage:page>1,
                nextPage:page+1,
                previousPage:page-1,
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
                
                });
            }).catch(err=>{
                console.log(err)
                const error=new Error(err);
                error.httpStatuCode=500;
                return next(error)
            })
    })
  

    }

exports.getProduct=(req,res,next)=>{
    const prodId=req.params.productId;
    // console.log(prodId);

    //to get the product 
    Product.findById(prodId)
    .then((product)=>{          //by just removeing the array from the object we can write
        res.render('shop/product-details',{
                    product:product,            //here also
                    pageTitle:product.title,
                    path:'/product',
                    isAuthenticated: req.session.isLoggedIn
                })
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })


}

exports.getIndex=(req,res,next)=>{
    const page=+req.query.page ||1;
    let totalItems;
    Product.find().countDocuments()
    .then(numProduct=>{
        totalItems=numProduct;
        return Product.find()
            .skip((page-1)*ITEMS_PER_PAGE)//skiping the previous page
            .limit(ITEMS_PER_PAGE) //limitting the page according to the items per page
            .then((products)=>{
                res.render('shop/index', {          //which file to render
                prod: products,
                pageTitle: 'Shop',
                path: '/' ,          
                currentPage:page,
                hasNextPage:ITEMS_PER_PAGE*page<totalItems,
                hasPreviousPage:page>1,
                nextPage:page+1,
                previousPage:page-1,
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
                
                });
            }).catch(err=>{
                console.log(err)
                const error=new Error(err);
                error.httpStatuCode=500;
                return next(error)
            })
    })

    
    
}

exports.getCart=(req,res,next)=>{
    req.user                //req user here and we need to create the user in main
    .populate('cart.items.productId')
    // console.log(cart.items.productId)
    // .execPopulate()
        .then(user=>{
            // console.log('user cart items',user.cart.items)
            const products=user.cart.items
            res.render('shop/cart', {          //which file to render
                pageTitle: 'YOur cart',
                path: '/cart',
                products :products ,
                isAuthenticated: req.session.isLoggedIn      
            });
        })
    
        .catch(err=>{
            console.log(err)
            const error=new Error(err);
            error.httpStatuCode=500;
            return next(error)
        })
}

exports.postCart=(req,res,next)=>{
    const prodId=req.body.productId;
    Product.findById(prodId)        //calling the product by id
    .then(product=>{                //product want to add the cart
        return req.user.addToCart(product) //
    }).then(result=>{
        console.log(result)
        res.redirect('/cart');
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })
}

exports.postDeleteCartProduct=(req,res,next)=>{
    const prodId=req.body.productId;
    req.user
    .deleteCartItem(prodId)
    .then(result=>{
        res.redirect('/cart');
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })
   
}


//creating method for ordering

exports.postOrder=(req,res,next)=>{
    req.user                //req users product details
    .populate('cart.items.productId')
        .then(user=>{    
            const products=user.cart.items.map(i=>{
                return {quantity:i.quantity,product:{...i.productId._doc}}//to get the full product details we need to add a spread operator and ._doc
            })
            const order=new Order({
                user:{
                    email:req.user.email,
                    userId:req.user
                },
                products:products
            });
            // console.log(req.user.userId)
            return order.save()
        })
        .then(result=>{
            req.user.clearCart();
            
        }).then(()=>{
            res.redirect('/orders');
        }
        )
        .catch(err=>{
            console.log(err)
            const error=new Error(err);
            error.httpStatuCode=500;
            return next(error)
        })
    };
    




exports.getOrders=(req,res,next)=>{
    Order.find({'user.name':req.session.user.name})
    .then(order=>{
        res.render('shop/orders', {          //which file to render
            pageTitle: 'YOur Orders',
            path: '/Orders'  ,
            order:order,
            isAuthenticated: req.session.isLoggedIn
    });
}).catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.httpStatuCode=500;
    return next(error)
})
}

exports.getCheckout=(req,res,next)=>{
    let products;
    let total;
    req.user                
    .populate('cart.items.productId')
        .then(user=>{
            products=user.cart.items;
            total=0;
            products.forEach(p=>{
                total +=p.quantity*p.productId.price
            })

            return stripe.checkout.sessions.create({
                payment_method_types:['card'],
                line_items:products.map(p=>{
                    return{
                        price_data: {
                            currency: 'usd', // Set the currency
                            product_data: {
                                name: p.productId.title, // Set the product name
                                description: p.productId.description, // Set the description
                            },
                            unit_amount: p.productId.price * 100, // Amount in the smallest currency unit (paise for INR)
                        },
                        quantity: p.quantity, // The quantity of the product
                    };
                    
                }),
                mode: 'payment',
                success_url:req.protocol + '://' +req.get('host')+'/checkout/success' ,//=>http://localhost:3000
                cancel_url:req.protocol + '://' +req.get('host')+'/checkout/cancel'
            });

            
        }).then(session=>{
            res.render('shop/checkout', {          //which file to render
                pageTitle: 'CheckOut',
                path: '/checkout',
                products :products ,
                totalSum:total,
                sessionId:session.id     
            });
        })
    
        .catch(err=>{
            console.log(err)
            const error=new Error(err);
            error.httpStatuCode=500;
            return next(error)
        })
}

exports.getInvoice=(req,res,next)=>{
    const orderId=req.params.orderId;
    Order.findById(orderId)
    .then(order=>{
        if(!order){
            return next(new Error("NO Order Found"))
        }
        // console.log("order",order)
        // console.log('order and user',order.user)
        // console.log('order and user with user id',order.user.userId)
        if(order.user.userId.toString()!==req.user._id.toString()){
            
            return next(new Error('UnAuthorized'));
        }
        const invoiceName="invoice-"+ orderId +".pdf";
        const invoicePath=path.join('data','invoices',invoiceName);
        // fs.readFile(invoicePath,(err,data)=>{        for small files its ok to take files from storage
        //     if(err){
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type','application/pdf');
        //     res.setHeader('Content-Disposition','inline;filename="'+invoiceName+'"');
        //     res.send(data);
        //     res.end();
        // });

        //insted of storing we can stream the files

        // const file=fs.createReadStream(invoicePath);
        // res.setHeader('Content-Disposition','inline;filename="'+invoiceName+'"');


        // also we can create pdf here itself using pdfkit a 3rd party package
        const pdfDoc=new pdfDocument();
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','inline;filename="'+invoiceName+'"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath))

        pdfDoc.pipe(res);
        pdfDoc.fontSize(16).text('Invoice NO : 1',{align:'center'});
        pdfDoc.text("------------------",{align:'center'})
        let totalPrice=0
        order.products.forEach(prod=>{
            totalPrice += prod.quantity*prod.product.price
            pdfDoc.fontSize(12).text(
                
                prod.product.title 
                +' - '+prod.quantity 
                +' x '+ prod.product.price +" rs" );
        })
        pdfDoc.text("total Price :"+totalPrice,{align:'center'})
        pdfDoc.end();
    })
    .catch(err=>{
        next(err)
    })
   
}