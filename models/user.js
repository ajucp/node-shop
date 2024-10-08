const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const userSchema=new Schema({
    // name:{
    //     type:String,
    //     required:true
    // },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetToken:String,
    resetTokenExp:Date,
    cart:{
        items:[{
            productId:{type:Schema.Types.ObjectId,ref:'Products',required:true},
            quantity:{type:Number, required:true}
        }]
    }
})

userSchema.methods.addToCart=function(product){   //calling the userSchema and the method of addToCart in it

    const cartProductIndex=this.cart.items.findIndex(cp=>{  //we have cart and items inside that

        return cp.productId.toString() ===product._id.toString() 
    });

    let newQuantity=1;
    const UpdatedCartItems=[...this.cart.items]//updating the cart if already the product is exist there
        if(cartProductIndex>=0){
            newQuantity=this.cart.items[cartProductIndex].quantity+1;
            UpdatedCartItems[cartProductIndex].quantity=newQuantity;
        }else{
            UpdatedCartItems.push({
                productId:product._id,
                quantity:newQuantity
            })
        }
    
        const UpdatedCart={items:UpdatedCartItems}// ony to get the reference of the object 
        this.cart=UpdatedCart
        return this.save();
}
userSchema.methods.deleteCartItem=function(productId){
    const UpdatedCartItems=this.cart.items.filter(item=>{
            return item.productId.toString() !== productId.toString()
        })
        this.cart.items=UpdatedCartItems
        return this.save()
}

userSchema.methods.clearCart=function(){
    this.cart={items:[]};
    return this.save()
}

module.exports=mongoose.model('User',userSchema);


// const mongodb=require('mongodb')
// const getDb  = require("../util/database").getDb;
//  const ObjectId=mongodb.ObjectId;

// class User{
//     constructor(username,email,cart,id){
//         this.name=username;
//         this.email=email;
//         this.cart=cart;//{item:{}} objects with some items
//         this._id=id;  
//     }

//     save(){
//         const db=getDb();
//         return db.collection('Users').insertOne(this)
//         .then(result)
//         .catch(err=>{
//             console.log(err)
//         })
//     }


//     getCart(){
//         // if (!this.cart) {
//         //     this.cart = { items: [] };
//         // } else if (!this.cart.items) {
//         //     this.cart.items = [];
//         // }
//         const db=getDb();
//         const productIds=this.cart.items.map(i=>{
//             // console.log("product details",i.productId)
//             return i.productId;
            
//         });
        
//         return db.collection('products')
//         .find({_id:{$in:productIds}}).toArray() //$in is a special method
//         .then(products=>{        //array of object
//             return products.map(p=>{     //return the array by map method            
//                 return{...p,quantity:this.cart.items.find(i=>{      //find-buildin js method()
//                     return i.productId.toString()===p._id.toString()
//                 }).quantity
//             }
//             })
//         })
//     }

//     deleteCartItem(productId){
//         const UpdatedCartItems=this.cart.items.filter(item=>{
//             return item.productId.toString() !== productId.toString()
//         })
//         const db=getDb();
//         return db.collection('Users')
//         .updateOne({_id:new ObjectId(this._id)},{$set:{cart:{item:UpdatedCartItems}}})

//     }

//     static findById(userId){
//         const db=getDb();
//         return db.collection('Users').findOne({_id:new ObjectId(userId)})
//         .then(user=>{
//             console.log(user);
//             return user;
//         })
//         .catch(err=>{
//             console.log(err)
//         })
//     }

//     addOrder(){
//         const db=getDb();
//         return this.getCart().then(products=>{
//             const order={
//                 items:products,
//                 user:{
//                     _id:new ObjectId(this._id),
//                     name:this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order)
//         })
//         .then(result=>{
//             this.cart={items :[]};//empty the cart here
//             //to clear it in database
//             return db.collection('Users')
//             .updateOne(
//                 {_id:new ObjectId(this._id)},
//                 {$set:{cart:{item:[]}}
//             });
//         });
//     }
//     getOrders(){
//         const db=getDb();
//         return db.collection('orders')
//         .find({'user._id':new ObjectId(this._id)})//nested property(user.id) when we use nested property we need to mention that in single or double for finding
//         .toArray();
//     }
// }

// module.exports=User