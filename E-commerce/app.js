const express = require('express');
const bodyParser = require('body-parser');
// const multer=require('multer');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
    secret: 'Alohomora',
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String

});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);//User Data

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



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
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }
})
const Bookbuy = new mongoose.model("Bookbuy", billSchema); //billing data

app.get('/', (req, res) => {
    const book = Book.find({}, (err, allBooks) => {
        if (err) {
            console.log(err);
        } else {
            res.render('index', { books: allBooks });
        }
    });

})


app.get('/sign-in', (req, res) => {
    res.render('sign-in');
})

app.post('/sign-in', (req, res) => {
    // const password=req.body.password;
    // const email=req.body.email;

    // User.findOne({email:email},function(err, foundUser){
    //     if(err)
    //     {
    //         console.log("3");
    //         console.log(err);
    //         console.log("4");
    //     }
    //     else{
    //         if(foundUser){
    //             if(foundUser.password === password){
    //                res.redirect('/'+foundUser._id);
    //             }else{
    //                 console.log("Wrong password");
    //             }

    //         }else{
    //             res.redirect('/sign-up')
    //         }
    //     }
    // })


})
app.get('/sign-up', (req, res) => {
    res.render('sign-up');
})

app.post('/sign-up', (req, res) => {
    // const newUser=new User({
    //     username:req.body.name,
    //     password:req.body.password,
    //     email:req.body.email

    //    });


    //    newUser.save(function(err){
    //        if(err){
    //         console.log("11");
    //         console.log(err);
    //         console.log("12");
    //        }else{
    //         res.redirect("/sign-in");
    //        }    
    //    })

    User.register({ username: req.body.username, email: req.body.mail }, req.body.password, function (err, user) {

        if (err) {
            console.log(err)
            res.redirect("/sign-up");
        } else {

            passport.authenticate("local", { session: true })(req, res, function () {
                res.redirect("/" + user._id);

            })
        }

    })


})


app.get("/:id", (req, res) => {
    Book.find({}, (err, allBooks) => {
        if (err) {
            console.log(err);
        } else {
            User.findById(req.params.id, (err, foundUser) => {
                if (err) {
                    console.log(err);
                }
                else {
                    if (req.isAuthenticated()) {
                        res.render("index_signed", { books: allBooks, user: foundUser });
                    } else {
                        res.redirect("/sign-in");
                    }
                }
            });
        }
    });



})

app.get('/book/:id', (req, res) => {

    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            console.log("9");
            console.log(err);
            console.log("10");
        } else {
            res.render('info', { book: foundBook });
        }
    })

})





app.get('/:id/bill', (req, res) => {
    Book.findById(req.params.id, (err, foundBook) => {
        if (err) {
            console.log("13");
            console.log(err);
            console.log("14");
        } else {
            res.render('bill', { book: foundBook });
        }
    })

})

app.post('/:id/bill', (req, res) => {


    const userBill = new Bookbuy({
        name: req.body.name,
        mnumber: req.body.number,
        address: req.body.address,
        country: req.body.country,
        city: req.body.city,
        book: req.params.id,
        cost: 20

    });

    userBill.save(function (err, savedBill) {
        if (err) {
            console.log("15")
            console.log(err)
            console.log("16")
        } else {
            res.redirect("/" + savedBill._id + "/bill/checkout");
        }
    })

})

app.get('/:id/bill/checkout', (req, res) => {

    Bookbuy.findById(req.params.id).populate("book").exec(function (err, foundBill) {
        if (err) {
            console.log("17");
            console.log(err)
            console.log("18");
        } else {
            // console.log(foundBill);
            res.render('checkout', { bill: foundBill });
        }
    })


})

app.get('/:id/bill/checkout/pay', (req, res) => {

    Bookbuy.findById(req.params.id).populate("book").exec((err, foundBill) => {
        if (err) {
            console.log("19");
            console.log(err)
            console.log("20");
        } else {
            res.render('pay', { bill: foundBill });
        }

    })

})




app.listen('3000', () => {
    console.log('Server is Started Sucessfully');
})
