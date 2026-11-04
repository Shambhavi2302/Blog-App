require('dotenv').config();
const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors');

const app = express();

const dbUrl = process.env.MONGO_URI;
const port = process.env.PORT || 4000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    return /https:\/\/.*\.vercel\.app$/i.test(origin) || /https:\/\/.*\.vercel\.app\//i.test(origin);
};

const cookieParser =
require("cookie-parser");

const userRouter=require('./routes/userRouter');
const postRouter=require('./routes/postRouter');
const categoryRouter=require('./routes/categoryRouter');
const commentRouter=require('./routes/commentRouter');
const newsletterRouter=require('./routes/newsletterRouter');
const followRouter=require('./routes/followRouter');
const savePostRouter=require('./routes/savePostRouter');

// connect with the mongodb database
if (!dbUrl) {
    console.error('MONGO_URI is not defined. Set it in your environment variables before starting the server.');
} else {
    mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 15000 })
        .then(() => console.log('Connection to mongodb succesful'))
        .catch((error) => console.log('Connection to mongodb failed:', error.message));
}

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.options(/.*/, cors());
app.use(express.urlencoded({extended:true}))

// simple request logger for debugging
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.originalUrl);
    next();
});

// default root
app.get('/',(req,res)=> {
    res.status(200).send("An API for products");
});

app.use('/api',userRouter);
app.use('/api',postRouter);
app.use('/api',categoryRouter);
app.use('/api',commentRouter);
app.use('/api',newsletterRouter);
app.use('/api',followRouter);
app.use('/api',savePostRouter);

app.listen(port,()=> console.log("Server listening at port no:"+port));
