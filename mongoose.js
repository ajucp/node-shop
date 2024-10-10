const path=require('path');
const fs=require('fs');
const express=require('express');
//import mongoose here no need of supperate file for that
const https=require('https');       //importing the https server for securing

const mongoose=require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(require('express-session'));
// const cookieParser = require("cookie-parser");
const session=require('express-session');
const bodyParser=require('body-parser');
const mongodbStore=require('connect-mongodb-session')(session);
const csrf=require('csurf');
const flash=require('connect-flash');//importing the flash message here
const errorController=require('./controllers/error404');
const multer=require('multer');

const adminRoutes=require('./routes/admin');
const shopRoutes=require('./routes/shop');
const authRoutes = require('./routes/auth');
const helmet=require('helmet');//import helmet for securing the headers
const compression=require('compression');//to compress the page size of any thing in the web
const morgan=require('morgan');     //for logging

// const MOngoDB_URI=`mongodb+srv://ajucp:5WZifQn3iwl4oHqx@cluster0.98nsj.mongodb.net/node-shop?retryWrites=true&w=majority`;
const MOngoDB_URI = `mongodb+srv://ajucp:5WZifQn3iwl4oHqx@cluster0.98nsj.mongodb.net/node-shop?retryWrites=true&w=majority`;


// const MOngoDB_URI = `mongodb+srv://ajmalcp:AuJT5T4gmA4kLiNT@cluster0.mongodb.net/node-shop?retryWrites=true&w=majority`;


const app=express();
// console.log('User:', process.env.MONGO_USER);
// console.log('Password:', process.env.MONGO_PASSWORD);
// console.log('Database Name:', process.env.MONGO_DB_NAME);

//for storing the session we need to add the constructor here
const storeSession=new mongodbStore({
    uri:MOngoDB_URI,
    collection:'session'

})

console.log(process.env.NODE_ENV);

const User=require('./models/user');

const csrfProtection=csrf()

app.set('view engine','ejs');   
app.set('views','views');

const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'image')
    },
    filename:(req,file,cb)=>{
        // cb(null,new Date().toISOString() +"-"+ file.originalname)
        cb(null, new Date().toISOString().replace(/:/g, '-') + "-" + file.originalname);
    }
})

const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='image/png' || file.mimetype==='image/jpg' || file.mimetype==='image/jpeg'){

        cb(null,true);
    }else{

        cb(null,false);
    }

}


app.use(bodyParser.urlencoded({extended:true}));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))//we use destination file to save or see the image to store we need to add the 
app.use(express.static(path.join(__dirname,'public')));
app.use('/image',express.static(path.join(__dirname,'image')));//serving the image statically
app.use(session({secret:'my secret',resave:false,saveUninitialized:false,store:storeSession}))//for session we need to give a secret and also 
                                                //we need to set the resave =false only the session will save if we change any thing in session


app.use(flash());//call the middleware as a funtion 
app.use(csrfProtection)                                                
app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken=req.csrfToken();
    next();
})
app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken=req.csrfToken();
    next();
})

//if we need to logging in different page or file
const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});//a-append 

//deploying

app.use(helmet());                  //calling the helmet functn
app.use(compression());             //calling the compression funtn
app.use(morgan('combined',{stream:accessLogStream}));           //logging the information
//create to key 
//  const privateKey=fs.readFileSync('server.key')      //import the key from file
//  const certificateKey=fs.readFileSync('server.cert') //importing the certificate and call that  in the server

app.use((req,res,next)=>{ 
    // throw new Error('sync error')
    if(!req.session.user) {
        return next();      
    }         
    User.findById(req.session.user._id)//finding user by id
    .then(user=>{
        // throw new Error('dummy error') //if we pass the throw inside a promise or async then the next will not reach out
        if(!user){
            return next();
        }
        req.user=user;
        next()
    }).catch(err=>{
        // console.log(err)
        next(new Error(err)) 
    })
    
})




app.use('/admin',adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',errorController.getError500);//for handdling the error page
app.use('',errorController.getError404);

// app.use((error,req,res,next)=>{
//     // res.redirect('/500');
//     res.status(500).render('500',
//         {
//             pageTitle:'Error!',
//             path:"/500",
//             isAuthenticated: req.session.isLoggedIn
//             // isAuthenticated: req.session ? req.session.isLoggedIn : false // Check if req.session exists
//         });
// })
 
// app.use(cookieParser());
 
// app.use((req, res, next) => {
//   req.isLoggedIn = req.cookies.isLoggedIn === 'true';
//   console,log(req.isLoggedIn)
//   next();
// });



//connecting the mongoose
new MongoDBStore({
    uri: MOngoDB_URI,
    collection: 'sessions',
    connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
});



mongoose
    .connect(MOngoDB_URI)

// mongoose.connect(MOngoDB_URI )
.then(result=>{
    app.listen(process.env.PORT||5000);
    // https.createServer({key:privateKey,cert:certificateKey},app).listen(process.env.PORT||3000)
})
.catch(err=>{
    console.log(err)
});


