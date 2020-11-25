//const Pool = require('pg').Pool
//const { Pool } = require('pg');
const { Pool, Client } = require('pg')

const express = require('express');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');

const cloudinary = require('./cloudinary')
const fs = require('fs') 




const connectionString ='postgres://use yours'

const pool = new Pool({

  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})
/*
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'edu',
  password: '',
  port: 5432,
})



*/
const pgPoolWrapper = {
    async connect() {
        for (let nRetry = 1; ; nRetry++) {
            try {
                const client = await pool.connect();
                if (nRetry > 1) {
                    console.info('Now successfully connected to Postgres');
                }
                return client;
            } catch (e) {
                if (e.toString().includes('ECONNREFUSED') && nRetry < 5) {
                    console.info('ECONNREFUSED connecting to Postgres, ' +
                        'maybe container is not ready yet, will retry ' + nRetry);
                    // Wait 1 second
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw e;
                }
            }
        }
    }
};

//pool.connect();

let file_type;
 
//setting storage engine
const storage = multer.diskStorage({
destination: './uploads',
filename: function(req,file,cb){
  cb(null,Date.now()+ '-' + file.originalname)
  file_type=path.extname(file.originalname);
}
});


//init upload
const upload = multer({
  storage: storage
}).single('myfile');







/*--------------------------------------------------------------------------------------------------------------------------------------------*/
/*
const getUsers = (request, response) => {
    pool.query('SELECT * FROM table_a.table_ac', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }


const getuserbyid = (request,response) => {
    pool.query(`select * from table_a.table_ac where col_id=${request.params.id}`, (error, results) => {
      //const id = parseInt(request.params.id);
      // or select * from table_a.table_ab where id=$1,[id],(error,results)  
      console.log(results.rows);
      
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
}
*/

/*--------------------------------------------------------------------------------------------------------------------------------------------*/
const register = (request,response)=>{
  const {fullname,email,password,type} = request.body; 
  let t;
  if(type==='teacher')
  t=true;
  else
  t=false;
  pool.query("select * from allusers where email=$1",[email], (error, results) =>{
    if(results.rows[0]!==undefined)
    {
    //response.send("email taken");
    const msg="Email taken. register with a new email";
    response.render("register.ejs",{msg});

    }
  
  pool.query("insert into allusers(uid,name,type,email,password) values(DEFAULT,$1,$2,$3,$4)",[fullname,t,email,password], (error, results) => {
    if (error) {
      //throw error
    }
    response.render("login.ejs");
  })

} );
}


/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const login = (request,response)=>{

  upload(request,response,(err)=>{
  const {email,password} = request.body; 
 
  pool.query("select * from allusers where email=$1",[email], (error, results) => {
    if (error) {
      throw error
    }
    
    if(results.rows[0]===undefined)
    {
      const msg="Invalid email. enter a valid one";
      response.render("login.ejs",{msg});
  
      }   
      // response.status(200).json(results.rows[0].num);
    else{
    if(results.rows[0]!==undefined && results.rows[0].password === password){
                        response.locals.userid=request.session.userid = results.rows[0].uid ;
                        response.locals.username=request.session.username = results.rows[0].name ;


                         if(results.rows[0].type===true){
                           pool.query("select * from allclasses where teacher_id=$1",[results.rows[0].uid],(err,res)=>{
                             if(err)
                             throw err;
                             else{
                             response.render("teacherdashboard.ejs",{data:results.rows,data2:res.rows});
                             }
                           })
                           
                         }
                         else{
                           pool.query("select * from student_class join allclasses on (c_id=class_id) where student_id=$1",[results.rows[0].uid],(err,res)=>{
                            response.render("studentdashboard.ejs",{data:res.rows,data2:results.rows});

                           })
                        }

      }
    else
    {
      const msg="Wrong password. Retry";
      response.render("login.ejs",{msg});
  
      }   
     }
  
  })

});
}
/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const addclass = (request,response)=>{
  const{class_name} = request.body;
  const uid=request.params.uid;
  
 // console.log(request.session.userid);
  //console.log(uid);

  //response.header('Cache-Control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');

  pool.query("insert into allclasses(class_name,teacher_id,class_id) values($1,$2,DEFAULT)",[class_name,uid],(error,re)=>{
    if (error) {
      throw error
    }
     else{

      pool.query("select * from allclasses where teacher_id=$1",[uid],(err,res)=>{
        if(err)
        throw err;
        else{
          pool.query("select * from allusers where uid=$1",[uid], (error, results)=>{
            //response.render("teacherdashboard.ejs",{data2:res.rows,data:results.rows});
            response.redirect(`../dashboard/${request.params.uid}`);

          })
        }
      })
     }



  })  
}


/*--------------------------------------------------------------------------------------------------------------------------------------------*/


const joinclass = (request,response)=>{
  const{c_id} = request.body;
  const uid=request.params.uid;
 
  pool.query("select * from allclasses where class_id=$1",[c_id],(err,res)=>{
    if(res.rows[0] == undefined)
    {
    //  response.redirect(`../dashboard/${request.params.uid}`);
    response.send('wrong class id. join using proper class id')
    }
  
  pool.query("insert into student_class(student_id,c_id) values($1,$2)",[uid,c_id],(error,re)=>{
    if (error) {
      throw error
    }
     else{
      pool.query("select * from allclasses join student_class on (class_id=c_id) where student_id=$1",[uid],(err,res)=>{
        if(err)
        throw err;
        else{
          pool.query("select * from allusers where uid=$1",[uid], (error, results)=>{

       // response.render("studentdashboard.ejs",{data:res.rows,data2:results.rows});
       response.redirect(`../dashboard/${request.params.uid}`);

          })
        }
      })
     }



  })
  
});
}


/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const addpost = async (req,response)=>{

pool.query("select update_cc();",(err,res)=>{});


upload(req,response,async(err)=>{
  //console.log('ho gaya');
//res.render('testing.ejs',{file:`imgupload/${req.file.filename}`});

//response.header('Cache-Control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
const {content}= req.body;
const cid = req.params.cid;

let nameofclass;
pool.query("select * from allclasses where class_id=$1",[cid],(error,results)=>{
  nameofclass=results.rows[0].class_name;
});

if( (req.file) == undefined)
{
  
  pool.query("insert into allfeeds(clas_id,post_id,timestamp,post_type,content_text,url) values($1,DEFAULT,DEFAULT,$2,$3,$4)",[cid,`text`,content,null],(error,results)=>{
    pool.query("select * from allfeeds where clas_id=$1 order by timestamp desc",[cid],(err,res)=>{
        //console.log(file_type);
        
       // response.render("teacherfeed.ejs",{data:res.rows,id:req.params.cid,file_type:file_type,nameofclass})
        response.redirect(`../teacherfeed/${req.params.cid}`);

    })
  })
}
else{

  const uploader = async (path) => await cloudinary.uploads(path,'files')
   const {path} = req.file
   const newPath =await uploader(path)
    const urls= newPath;

  /*  console.log("path =" + path);
    console.log("newpath =" + newPath);
    console.log("urls =" + urls);
*/

pool.query("insert into allfeeds(clas_id,post_id,timestamp,post_type,content_text,url,file_nam) values($1,DEFAULT,DEFAULT,$2,$3,$4,$5)",[cid,`text+${file_type}`,content,urls.url,req.file.originalname],(error,results)=>{
  pool.query("select * from allfeeds where clas_id=$1 order by timestamp desc",[cid],(err,res)=>{
      //console.log(file_type);
      fs.unlinkSync(path)
     response.redirect(`../teacherfeed/${req.params.cid}`);

     // response.render("teacherfeed.ejs",{data:res.rows,id:req.params.cid,file_type:file_type,nameofclass})
  })
})
}
});

}


/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const gettfeed = (request,response)=>{
const cid = request.params.cid;

let nameofclass;
pool.query("select * from allclasses where class_id=$1",[cid],(error,results)=>{
  nameofclass=results.rows[0].class_name;
});

//console.log(cid);
//console.log(nameofclass);
pool.query("select update_cc();",(err,res)=>{

pool.query("select * from allfeeds where clas_id=$1 order by timestamp desc",[cid],(error,results)=>{
    
  response.render("teacherfeed.ejs",{data:results.rows,id:request.params.cid,nameofclass});

}) 
});
}


/*--------------------------------------------------------------------------------------------------------------------------------------------*/


const getsfeed = (request,response)=>{
  const cid = request.params.cid;
  
//response.header('Cache-Control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');

  let nameofclass;
pool.query("select * from allclasses where class_id=$1",[cid],(error,results)=>{
  nameofclass=results.rows[0].class_name;
});

pool.query("select update_cc();",(err,res)=>{
  pool.query("select * from allfeeds where clas_id=$1 order by timestamp desc",[cid],(error,results)=>{
    response.render("studentfeed.ejs",{data:results.rows,id:request.params.cid,nameofclass});
  
  })
});

  }


/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const getcomment= (request,response)=>{
  const pid = request.params.pid;
  pool.query("select * from allcomments where pos_id=$1",[pid],(error,results)=>{
    response.render("comment.ejs",{data:results.rows,id:request.params.pid})
  })
 
}

/*--------------------------------------------------------------------------------------------------------------------------------------------*/

const addcomment= (request,response)=>{
  const pid = request.params.pid;
  const{content}= request.body;

 /* console.log(pid);
  console.log(content);
  console.log(request.body); */
  pool.query("insert into allcomments(index,pos_id,comment) values(DEFAULT,$1,$2)",[pid,content],(error,results)=>{

    if(error)
    console.log(error);
    pool.query("select * from allcomments where pos_id=$1",[pid],(error,results)=>{
      //console.log(error);
      //response.render("comment.ejs",{data:results.rows,id:request.params.pid})
      response.redirect(`../comment/${request.params.pid}`);

    })

  })


}


const dashboard= (req,response)=>{
  const uid=req.params.uid;

  pool.query("select * from allusers where uid=$1",[uid], (error, results) =>{
   if( results.rows[0].type == true)
   {
    pool.query("select * from allclasses where teacher_id=$1",[uid],(err,res)=>{
      if(err)
      throw err;
      else{
      response.render("teacherdashboard.ejs",{data:results.rows,data2:res.rows});
      }
    })
   }
   else{
    pool.query("select * from student_class join allclasses on (c_id=class_id) where student_id=$1",[uid],(err,res)=>{
      response.render("studentdashboard.ejs",{data:res.rows,data2:results.rows});

     })
   }
})
}
/*--------------------------------------------------------------------------------------------------------------------------------------------*/
  module.exports= {register,login,addclass,joinclass,gettfeed,addpost,getsfeed,getcomment,addcomment,dashboard}