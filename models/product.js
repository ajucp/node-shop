const mongoose=require('mongoose');

const Schema=mongoose.Schema;//import schema 
//since nosql is schema less we use schema

const  productSchema=new Schema({   //pass the table values as object
    //title:String;
    title:{     //here also we can pass as object
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',//referance of the User table
        required:true
    }
})

module.exports=mongoose.model('Products',productSchema);//exporting the models

