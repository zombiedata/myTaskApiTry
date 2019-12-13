const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const User = require("../models/user");
const sharp = require("sharp");
const { sendWelcomeEmails, cancelEmailAccount } = require("../emails/account");

const router = new express.Router();

// user creation end point
router.post("/users", async (req, res) => {

    try {
        const user = new User(req.body)
        const token = await user.generateAuthToken();
        await user.save();

        sendWelcomeEmails(user.email, user.name)

        res.status(201).send({user, token})    
    } catch(e) {
        res.status(400).send(e)
    }

})


// user login end point
router.post("/users/login", async (req, res) => {

    try {
        const user = await User.findByCredintials(req.body.email, req.body.password);
        const token = await user.generateAuthToken()
        
        res.send({user, token})
    } catch(e) {
        res.status(400).send();
    }

})

// user logout end points
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token
        })

        await req.user.save();

        res.send(req.user)
    } catch(e) {
        res.status(500).send();
    }
})

// logout all
router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send(req.user);
    } catch(e) {
        res.status(500).send();
    }
})

// getting profile of users
router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
    // try {
    //     const users = await User.find({});    
    //     res.send(users)
    // } catch(e) {
    //     res.status(500).send(e)
    // }
})

// findById resource reading point
// router.get("/users/:id", async (req, res) => {
//     const _id = req.params.id;

//     try {
//         const user = await User.findById(_id)

//         if(!user) {
//             return res.status(404).send();
//         }

//         res.send(user)
//     } catch(e) {
//         res.status(500).body();
//     }    
// })


// updating user's data
router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "age", "password"]
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: "Invalid user request"})
    }

    try {

        updates.forEach(update => { req.user[update] = req.body[update] })

        await req.user.save();

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true, useFindAndModify: false});

        // if(!user) {
        //     return res.status(404).send();
        // }

        res.send(req.user)

    } catch(e) {
        res.status(500).send(e)
    }

})

// deleting users by there id
router.delete("/users/me", auth, async (req, res) => {
    try {

        await req.user.remove();

        cancelEmailAccount(req.user.email, req.user.name);

        // old codes
        // const user = await User.findByIdAndDelete(req.params.id);

        // if(!user) {
        //     return res.status(404).send();
        // }

        res.send(req.user);

    } catch (e) {
        res.status(500).send();
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("please upload image file with extenstions jpg, jpeg, and png only"))
        }

        cb(undefined, true)
    }
});

// store avatar/update in db
router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).toFormat("png").toBuffer()
    req.user.avatar = buffer

    await req.user.save();
    
    res.status(200).send(req.user);
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// delete avatar in db
router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send()   
})

// getting pictures in browsers links
router.get("/users/:id/avatar", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send();
    }
})

module.exports = router;