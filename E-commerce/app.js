require("dotenv").config();

const express               = require('express'),
      passport              = require('passport'),
      app                   = express(),
      bodyParser            = require('body-parser'),
      mongoose              = require('mongoose'),
      session               = require('express-session'),
      LocalStrategy         = require('passport-local'),
      passportLocalMongoose = require('passport-local-mongoose'),
      fetch                 = require('node-fetch');
      cloudinary = require('cloudinary').v2;
      expressip = require('express-ip');
 
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(expressip().getIpInfoMiddleware);

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: String,
    bills: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bookbuy"
        }
    ],
    userImg:String

});


userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);//User Data


const bookSchema = new mongoose.Schema({
    bookname: String,
    para1: String,
    para2: String,
    para3: String,
    himg: String,
    bookimage: String
})

const Book = new mongoose.model("Book", bookSchema);//book data

const billSchema = new mongoose.Schema({
    name: String,
    mnumber: String,
    address: String,
    city: String,
    country: String,
    cost: Number,
    zipcode:String,
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    paymentStatus: {
        type: String, 
        default: 'pending'
    }
})

const Bookbuy = new mongoose.model("Bookbuy", billSchema); //billing data

app.use(session({
    secret: 'Alohomora',
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });




app.get('/', (req, res) => {
    const book = Book.find({}, (err, allBooks) => {
        if (err) {
            console.log("1")
            console.log(err);
            console.log("1")
        } else {
            res.render('index', { books: allBooks });
        }
    });

})


app.get('/sign-in', (req, res) => {
    res.render('sign-in');
})
app.get("/success",isLoggedIn,(req,res)=>{
    res.render("success");
})

app.get("/fpass",isNotLoggedIn,(req,res)=>{
    res.render("fpass");
})

app.get("/fail",isLoggedIn,(req,res)=>{
    res.render("fail");
})
app.post("/sign-in", isNotLoggedIn, passport.authenticate("local",
    {
        successRedirect: "/",
        failureRedirect: "/sign-in",
        badRequestMessage: 'Missing username or password.',
    }), function(req, res){
        console.log("2")
        console.log("in")
});



app.get('/logout', isLoggedIn, function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/sign-up', isNotLoggedIn, (req, res) => {
    res.render('sign-up');
})

app.post('/sign-up', isNotLoggedIn, (req, res) => {
    User.register({ username: req.body.username, email: req.body.email }, req.body.password, function (err, user) {

        if (err) {
            console.log("3")
            console.log(err)
            res.redirect("/sign-up");
        } else {
            if(req.body.password === req.body.vpassword){
                passport.authenticate("local", { session: true })(req, res, function () {
                    res.redirect("/");
            })
        }
        else{
                console.log("Verifying Password and Password is not Same !");
                
            }
        

            }
        

    })


})



app.get('/:id', isLoggedIn, (req, res) => {

    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            
        } else {
            res.render('info', { book: foundBook });
        }
    })

    

})





app.get('/:id/bill', isLoggedIn, (req, res) => {
    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            console.log(err);
        } else {
            res.render('bill', { book: foundBook });
        }
    })

})

app.post('/:id/bill', isLoggedIn, (req, res) => {


    const userBill = new Bookbuy({
        name: req.body.name,
        mnumber: req.body.number,
        address: req.body.address,
        country: req.body.country,
        city: req.body.city,
        zipcode:req.body.code,
        book:req.params.id,
        cost: 1000,
        buyer: req.user._id
    });

    userBill.save(function (err, savedBill) {
        if (err) {
            console.log(err)
        } else {
            User.findOne({username: req.user.username}, function(err, foundUser){
                if(err){
                    console.log(err);
                }
                foundUser.bills.push(savedBill);
                foundUser.save(function(err, savedUser){
                    res.redirect("/" + savedBill._id + "/bill/checkout");
                })
            });
            
        }
    });


})

app.get('/:id/bill/checkout', isLoggedIn, (req, res) => {

    Bookbuy.findById(req.params.id).populate("book").exec(function (err, foundBill) {
        if (err) {
            console.log(err)
        } else {
            res.render('checkout', { bill: foundBill });
        }
    })


});

app.get("/:id/photo", isLoggedIn, (req,res)=>{
    res.render("photo",{bill_id:req.params.id});
   
})

app.post("/:id/photo", isLoggedIn, (req, res) => {
    console.log("OUT");
    const data=req.body;
    

    cloudinary.uploader.upload(data.imgUrl, function(error, result) {
        
        req.user.userImg=result.secure_url;
        req.user.save();

    });
});

app.get('/:id/bill/checkout/pay', isLoggedIn, (req, res) => {

   

    Bookbuy.findById(req.params.id).populate("book").exec((err, foundBill) => {
        if (err) {
            console.log(err)
        } else {
            res.render('pay', { bill: foundBill });
        }

    })

});

app.post('/:id/bill/checkout/pay', isLoggedIn, (req, res) => {

   
    let data = {
        cc_no: req.body.cc_no,
        cvv: req.body.cvv,
        expiry: req.body.expiryDate,
        amount: req.body.amount,
        description: req.body.description,
        merchant_account_no: "87944526076700",
        customerImg: req.user.userImg
    };
    
    fetch('http://127.0.0.1:5000/G7RUTMM0BAGPS0529MF53XAXA0TFZH49HE9X9SULXK9WC5ZPU0/remote_transaction', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
      .then(response => {
          if(response.statusCode === "I00001"){
              Bookbuy.findById(req.params.id, function(err, foundBill){
                    console.log(foundBill);
                    foundBill.paymentStatus = "success";
                    foundBill.save(function(err, savedBill){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log(savedBill);
                            res.redirect("/success");
                        }
                    });  
              });
          }
          else{
                Bookbuy.findById(req.params.id, function(err, foundBill){
                    foundBill.paymentStatus = "failed";
                    foundBill.save(function(err, savedBill){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log(savedBill);
                            console.log(response)
                            res.redirect("/fail");
                        }
                    });  
                });
            }
        });   
});   







// Middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        res.redirect("/sign-in");
    }
}

function isNotLoggedIn(req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}
	else{
		res.redirect("/");
	}
} 




app.listen('3000', () => {
    console.log('Server is Started Sucessfully');
})