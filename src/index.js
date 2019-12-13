const express = require('express');
const chalk = require('chalk');
require("./db/mongoose");
const User = require("./models/user");
const Task = require("./models/task");
const userRouter = require("./router/user");
const taskRouter = require("./router/task");


const app  = express();
const port = process.env.PORT


app.use(express.json());

// setting up routers
app.use(userRouter);
app.use(taskRouter);


app.listen(port, () => {
    console.log(`server is up on ${port}`)
})

