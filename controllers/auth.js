const crypto=require('crypto')
const bcrypt=require('bcryptjs')//install the bcryptjs for the password encryption
const nodemailer=require('nodemailer');
const { MailtrapTransport } = require("mailtrap");
const User=require('../models/user');
const {validationResult}=require("express-validator");

const TOKEN ='b404cea12688e7b47d549509f3ae5e11';
// const transport = nodemailer.createTransport(
//   MailtrapTransport({
//     token: TOKEN,
//     testInboxId: 3130188,
//   })
// );
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure:false,
  auth: {
    user: "7dadffa347b491",
    pass: "2a4e17d6953658"
  },
  debug:true,
  logger:true
});

exports.getLogin = (req, res, next) => {
  // let isLoggedIn = " ";
  // if (req.get("Cookie")) {
  //   isLoggedIn = req.get("Cookie").trim().split("=")[1];
  // }
  // const isLoggedIn=req.get('Cookie').split(';')[3].trim().split('=')[1]
  // console.log(isLoggedIn)
  let message=req.flash('err');
  if(message.length>0){
    message=message[0]
  }else{
    message=null
  }
  console.log(req.session.isLoggedIn)
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage:message,
    oldInput:{
      email:'',
      password:''
    }
  });
};

exports.postLogin = (req, res, next) => {
    const email=req.body.email;
    const password=req.body.password
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage:errors.array()[0].msg,
        oldInput:{email:email,password:password}
      });
    }

    User.findOne({email:email})
    .then(user=>{
      if(!user){
        // req.flash('err','Invalid Email or Password.')
        // return res.redirect('/login');
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage:'Invalid Email or Password.',
          oldInput:{email:email,password:password}
        });
      }
      //validating the password
      bcrypt.compare(password,user.password)
      .then(doMatch=>{
        if(doMatch){
          req.session.isLoggedIn=true;
          req.session.user=user;
          return req.session.save(err=>{
          console.log(err)
          res.redirect('/')
      });
      }
      req.flash('err','Invalid Email or Password.')
        // res.redirect('/login')
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage:'Invalid Email or Password.',
          oldInput:{email:email,password:password}
        });
      })
      .catch(err=>{
        console.log(err)
        res.redirect('/login')
      })
      
    }).catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.httpStatuCode=500;
      return next(error)
  })
  };
  
  exports.postLogout = (req, res, next) => {
   
      req.session.destroy((err)=>{
        console.log(err)
        res.redirect('/');
      })

   
  }

  exports.getSignup = (req, res, next) => {
  let message=req.flash('err');
  if(message.length>0){
      message=message[0]
    }else{
      message=null
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:message,
      oldInput:{
        
        email:'',
        password:'',
        confirmPassword:''
      }
    });
  };

  exports.postSignup = (req, res, next) => {
    const email=req.body.email;
    const password=req.body.password;
    // const confirmPassword=req.body.confirmPassword;
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      console.log(errors.array())
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage:errors.array()[0].msg,//ouputing the message-invalid also we can customize it
        oldInput:{email:email,password:password,confirmPassword:req.body.confirmPassword}
      });
    }
    // User.findOne({email:email})
    // .then(userDoc=>{
    //   if(userDoc){
    //     req.flash('err','E-Mail already exist,Please try with another')
    //     return res.redirect('/signup')
    //   }
    bcrypt
      .hash(password,12)//call the bcrypt into hash
      .then(hashPassword=>{  
        const user=new User({
          email:email,
          password:hashPassword,//call that hashpassword
          cart:{items:[]}
        });
        return user.save()
      })
      .then(result=>{
        res.redirect('/login')
        // const sender = {
        //   address: "ajmalcp@example.com",
        //   name: "ajmal",
        // };
        // const recipients = [
        //   {email:email}
        // ];
        const mail = transport.sendMail({
          to:email,
          from:'ajmalcp4@demomailtrap.com',
          subject:'Sign-up Succeeded!',
          html:'<h1>YOU SUCCESSFULLY SIGNED UP!</h1>',
          sandbox: true
        });

        console.log(mail, 'mailData')
        return mail
        
      }).catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })
    }

  exports.getReset=(req,res,next)=>{
    let message=req.flash('err');
  if(message.length>0){
      message=message[0]
    }else{
      message=null
    }
    res.render('auth/reset', {
      path: '/reset',
      pageTitle: 'reset Password',
      errorMessage:message
    });
  };

  exports.postReset=(req,res,next)=>{
    crypto.randomBytes(32,(err,buffer)=>{//to create the token we need to import the crypto 
      if(err){
        console.log(err);
        return res.redirect('/reset')
      }
    
      const token=buffer.toString('hex');
      User.findOne({email:req.body.email})
      .then(user=>{
        if(!user){
          req.flash('err','NO ACCOUNT FOUND FOR THIS EMAIL_ID')
          return res.redirect('/reset')
        }
        user.resetToken=token;
        user.resetTokenExp=Date.now()+3600000;
        return user.save()
      })
      .then(result=>{
        res.redirect('/')
        transport.sendMail({
          to:req.body.email,
          from:'ajmalcp4@demomailtrap.com',
          subject:'PASSWORD RESET',
          html:
          `
          <p>You requested a password reset </p>
          <p>click this <a href="http://localhost:3000/reset/${token}"> link </a> to set a new password</p>
          `
        })
      })

      .catch(err=>{
        console.log(err)
        const error=new Error(err);
        error.httpStatuCode=500;
        return next(error)
    })
    })
  }

  exports.getNewPassword=(req,res,next)=>{
    const token=req.params.token;
    User.findOne({resetToken:token,resetTokenExp:{$gt:Date.now()}})
    .then(user=>{
      let message=req.flash('err');
      if(message.length>0){
          message=message[0]
        }else{
          message=null
        }
        res.render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'New Password',
          errorMessage:message,
          userId:user._id.toString(),
          passwordToken:token
          
        });
        

    })
    .catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.httpStatuCode=500;
      return next(error)
  })
  };
  
  exports.postNewPassword=(req,res,next)=>{
    const newPassword=req.body.password;
    const userId=req.body.userId;
    const passwordToken=req.body.passwordToken;
    let resetUser;

    User.findOne({resetToken:passwordToken,resetTokenExp:{$gt:Date.now()},_id:userId})
    .then(user=>{
      resetUser=user;
      return bcrypt.hash(newPassword,12)
    })
    .then(hashedPassword=>{
      resetUser.password=hashedPassword;
      resetUser.resetToken=undefined;
      resetUser.resetTokenExp=undefined;
      return resetUser.save()
    })
    .then(result=>{
      res.redirect('/login')
      
    })
    .catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.httpStatuCode=500;
      return next(error)
  })
  }