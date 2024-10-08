exports.getError404=(req,res,next)=>{
    res.status(404).render('404error',{pageTitle:'Page not found',path:"",isAuthenticated: req.session.isLoggedIn});//need to call the path to solve the path not found error
    return;
} // calling the error in the controller file 


exports.getError500=(req,res,next)=>{
    res.status(500).render('500',
        {
            pageTitle:'Error!',
            path:"/500",
            isAuthenticated: req.session.isLoggedIn
        });
    return;
}