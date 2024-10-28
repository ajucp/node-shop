const mongodb=require('mongodb');
const fileHelper=require('../util/file');
const Product=require("../models/product");
const {validationResult}=require("express-validator");


exports.getAddproducts=(req,res,next)=>{
    res.render('admin/edit-product',{
        pageTitle:'Add-product',
        path:'/admin/add-product', 
        editing: false,
        hasError:false,
        errorMessage:null,
        
 } ) ;
 
}


exports.postAddproducts=(req,res,next)=>{
    const title=req.body.title;
    const image=req.file;
    console.log(typeof(image))
    console.log(image)
    const price=req.body.price;
    const description=req.body.description;
    // console.log('image url:',imageUrl)
    
    // console.log(errors)

    if(!image){             //checking the image 
        return res.status(422).render('admin/edit-product',{
            pageTitle:'Add product',
            path:'/admin/edit-product', 
            editing: false,
            hasError:true,
            product:{
                title:title,
                price:price,
                description:description
            },
            errorMessage:'please attach a file of png or jpg ',//error message to the user
        })
    }

    const imageUrl=image.path;//setting the imageurl to image url path
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        // console.log(errors.array());
        return res.status(422).render('admin/edit-product',{
            pageTitle:'Add product',
            path:'/admin/edit-product', 
            editing: false,
            hasError:true,
            product:{
                title:title,
                imageUrl:imageUrl,
                price:price,
                description:description
            },
            errorMessage:errors.array()[0].msg,
            // debug:true,
     } );
    }
    const product= new Product({
        // _id:new mongoose.Types.ObjectId('66e2dd140ee9a07a7b4f13f0'),
        title:title,
        imageUrl:imageUrl,
        description:description,
        price:price,
        userId:req.user     //req the full user and it will automatically take the userId here
    })//we will not pass multiple arg only pass 1 js object
    //can pass the object in any order bcz its js object leftside(models schema):rightside(data Receives in ur controller action)
   product.save()//save method is using by mongoose we are not defining that
    .then(result=>{        //then use the then and catch method
        console.log("Created");
        // console.log(result)
        res.redirect('/admin/products')
    }).catch(err=>{
        // console.log(err);
        // res.redirect('/500')
        //insted of redirecting we can use middleware for error handling
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    }) 
    
}

exports.getEditProduct=(req,res,next)=>{
    const editMode=req.query.edit;       //query parameter is used for passing any url by adding a question mark and any key value pair
    if(!editMode){
        return res.redirect('/');
    }
    const prodId=req.params.productId;
    Product.findById(prodId)//edit the productby id
    // req.session.user.getProducts({where:{id:prodId}})       //edit by admin
    .then(product=>{                //to edit the product 
        // throw new Error("dummy");
        if(!product){
            
            return res.redirect('/');
        }
        res.render('admin/edit-product',{
            pageTitle:'edit-product',
            path:'/admin/edit-product', 
            editing: editMode,
            product:product,
            hasError:false,
            errorMessage:null
     } );
    }).catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })

}

exports.postEditProducts=(req,res,next)=>{
    const prodId=req.body.productId
    const updatetitle=req.body.title;
    const image=req.file;
    const updateDesc=req.body.description;
    const updateprice=req.body.price;

    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product',{
            pageTitle:'Edit product',
            path:'/admin/edit-product', 
            editing: true,
            hasError:true,
            product:{
                title:updatetitle,
                price:updateprice,
                description:updateDesc,
                _id:prodId
            },
            errorMessage:errors.array()[0].msg,
     } );
    }
   Product.findById(prodId).then(product=>{
    if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/')
    }
    product.title=updatetitle;
    if(image){
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl=image.path;
    }
    product.description=updateDesc;
    product.price=updateprice;

       product.save()
       .then(result=>{ //calling the above promise
           console.log("updated products");
           res.redirect('/admin/products');//redirect to the correct page and want to make changes
       })
   })
   .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.httpStatuCode=500;
    return next(error)
})
   
};

exports.getProducts=(req,res,next)=>{
    // Product.find()
    Product.find({userId:req.user._id})// one method for authorization
    .then((products)=>{
        res.render('admin/products',{
        // res.json( {          //which file to render
            prod: products,
            pageTitle: 'Admin products',
            path: '/admin/products',
            isAuthenticated: req.session.isLoggedIn           //mention the path which we have given 
          });
    
    }).catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })
}

exports.deleteProduct=(req,res,next)=>{
    const prodId=req.params.productId;
    Product.findById(prodId).then(product=>{
        if(!product){
            return next(new Error("Product is not Found"))
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id:prodId,userId:req.user._id})//delete function in mongoose-findByIdAndDelete also pass the user id for deleting only for the admin
    })
    .then(result=>{
        console.log('product deleted successfully');
        res.status(200).json({"message":"successfully deleted"})
    })
    .catch(err=>{
        res.status(500).json({"message":"Error has occured while deleting the product"})
    })
    
}