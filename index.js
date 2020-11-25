const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session);
const db = require('./dbqueries');

const app = express();

const port=process.env.PORT;


//body parser
app.use(bodyParser.json())   // app.use for middleware 
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
var urlencodedParser = bodyParser.urlencoded({ extended: false })

//for css and media files
app.use(express.static('./'));

app.use('/assets',express.static('assets'));

//express-session
app.use(session({
  store: new pgSession({
    conString:xyz//use your connection string,
       ,ssl: {
        rejectUnauthorized: false
      }
  }),
  name:'sid',
  secret: 'yahi hai secret',
  saveUninitialized: false,
  resave: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: true,
    secure: 'auto'
   } // 30 days
}));


const redirectlogin = (req,res,next)=>{
  //console.log(req.session.userid);
  if(!req.session.userid)
  {
    res.redirect('/login')
  }
  else{
    next();
  }
}

app.use((req,res,next)=>{
  res.locals.userid=req.session.userid;
  res.locals.username=req.session.username;
  next();
})

/*const redirecthome = (req,res,next)=>{
  //console.log(req.session.userid);
  if(req.session.userid)
  {
    res.redirect('/')
  }
  else{
    next();
  }
}*/

/*--------------------------------------------------------------------------------------------------------------------------------------------*/

//app.get('/all',db.getUsers);

//app.get('/profile/:id',db.getuserbyid);

app.get('/', (request, response) => {
  //console.log(request.session);
    response.render("landing.ejs");
  });


app.get('/register',function(req,res){                   // render register page
   res.render("register.ejs");
});

app.get('/login',function(req,res){                       //render login page
  res.render("login.ejs");
});

app.post('/register',db.register);                         //getting registration data

app.post('/login',db.login);                    // getting login data


app.post('/addclass/:uid',redirectlogin, db.addclass);                   // add class by teacher

app.post('/joinclass/:uid',redirectlogin, db.joinclass);                 // join class by student

app.get('/teacherfeed/:cid',redirectlogin,db.gettfeed);

app.post('/addpost/:cid',redirectlogin, db.addpost);

app.get('/studentfeed/:cid',redirectlogin, db.getsfeed);

app.get('/comment/:pid',redirectlogin, db.getcomment);

app.post('/comment/:pid',redirectlogin, db.addcomment);


app.get('/aboutus',function(req,res){                       //render login page
  res.render("aboutus.ejs");
});

app.get('/dashboard/:uid',redirectlogin,db.dashboard)

app.post('/logout',redirectlogin,(req,res)=>
{
  req.session.destroy(err=>{
    // console.log(err);

    res.clearCookie('sid');
    res.redirect('/');
  })
})
/*--------------------------------------------------------------------------------------------------------------------------------------------*/

/*
app.get('*',redirectlogin, function(req,res){
  res.redirect('/');
})*/

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })