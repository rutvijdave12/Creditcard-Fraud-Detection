const express = require('express');
const bodyParser=require('body-parser');
// const multer=require('multer');
const ejs=require('ejs');
const mongoose=require('mongoose');


const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true})

const userSchema = {
    username:String,
    email:String,
    password:String

}
const User=new mongoose.model("User", userSchema);//User Data

const bookSchema = {
    bookname:String,
    para1:String,
    para2:String,
    para3:String,
    himg:String,
    bookimage:String
}
const Book=new mongoose.model("Book",bookSchema);//book data

const billSchema = {
    name:String,
    mnumber:String,
    address:String,
    city:String,
    country:String,
    cost:Number,
    book:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Book"
    }
}
const Bookbuy=new mongoose.model("Bookbuy",billSchema); //billing data








app.get('/', (req, res)=>{
    const book=Book.find({}, (err,allBooks)=>{
        if(err){
            console.log("1");
            console.log(err);
            console.log("2");
        }else{
        
        res.render('index',{books:allBooks});
        }
    });
    
}) 



app.get('/sign-in', (req, res)=>{
    res.render('sign-in');
}) 

app.post('/sign-in',(req,res)=>{
    const password=req.body.password;
    const email=req.body.email;

    User.findOne({email:email},function(err, foundUser){
        if(err)
        {
            console.log("3");
            console.log(err);
            console.log("4");
        }
        else{
            if(foundUser){
                if(foundUser.password === password){
                   res.redirect('/'+foundUser._id);
                }else{
                    console.log("Wrong password");
                }

            }else{
                res.redirect('/sign-up')
            }
        }
    })

   
})

app.get("/:id",(req,res)=>{
    const book=Book.find({}, (err,allBooks)=>{
        if(err){
            console.log("5");
            console.log(err);
            console.log("6");
        }else{
         foundBook=allBooks;
        // res.render('index',{books:allBooks});
        }
    });
    User.findById(req.params.id,(err,foundUser)=>{
        if(err){
            console.log("7");
            console.log(err)
            console.log("8");
        }else{
            res.render("index_signed",{user:foundUser,books:foundBook});
        }
    })


})


app.get('/book/:id', (req, res)=>{
    
    Book.findById(req.params.id,(err,foundBook)=>{
        if(err){
            console.log("9");
            console.log(err);
            console.log("10");
        }else{
            res.render('info',{book:foundBook});
        }
    })  
    
}) 

app.get('/sign-up', (req, res)=>{
    res.render('sign-up');
}) 

app.post('/sign-up',(req,res)=>{
    const newUser=new User({
        username:req.body.name,
        password:req.body.password,
        email:req.body.email
    
       });


       newUser.save(function(err){
           if(err){
            console.log("11");
            console.log(err);
            console.log("12");
           }else{
            res.redirect("/sign-in");
           }    
       })
    
})

app.get('/:id/bill', (req, res)=>{
    Book.findById(req.params.id,(err,foundBook)=>{
        if(err){
            console.log("13");
            console.log(err);
            console.log("14");
        }else{
            res.render('bill',{book:foundBook});
        }
    })  
    
}) 

app.post('/:id/bill',(req,res)=>{


    const userBill=new Bookbuy({
        name:req.body.name,
        mnumber:req.body.number,
        address:req.body.address,
        country:req.body.country,
        city:req.body.city,
        book:req.params.id,
        cost:20
          
       });

       userBill.save(function(err, savedBill){
           if(err){ 
            console.log("15")
               console.log(err)
               console.log("16")
           }else{
            res.redirect("/"+savedBill._id+"/bill/checkout");
           }
       })
    
})

app.get('/:id/bill/checkout', (req, res)=>{

    Bookbuy.findById(req.params.id).populate("book").exec(function(err,foundBill){ 
        if(err){
            console.log("17");
        console.log(err)
        console.log("18");
    }else{
        // console.log(foundBill);
        res.render('checkout',{bill:foundBill});
    }
    })

    
})

app.get('/:id/bill/checkout/pay', (req, res)=>{

    Bookbuy.findById(req.params.id).populate("book").exec((err,foundBill)=>{
        if(err){
            console.log("19");
            console.log(err)
            console.log("20");
        }else{
            res.render('pay',{bill:foundBill});
        }

    })
    
}) 




app.listen('3000',()=>{
    console.log('Server is Started Sucessfully');
})
