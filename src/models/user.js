const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("INVALID EMAIL ADDRESS");
            }
        }
    },
    password: {
        type: String,
        trim: true,
        requird: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw new Error(" YOUR SECURITY KEY SHOUDN'T CONTAIN \"PASSWORD\" ")
            }
        }
    },
    age: {
        type: Number,
        requird: true,
        default: 0
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// setting up virtual property it means it is not going to store in database
// we are setting up this for making relation between task and user
userSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
})


userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;


    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET_KEY);

    user.tokens = user.tokens.concat({token: token});
    await user.save();

    return token;
}

userSchema.statics.findByCredintials = async (email, password) => {
    
    const user = await User.findOne({email: email});
    if(!user) {
        throw new Error("Invalid login credintials");
    }

    const isMatched = await bcrypt.compare(password, user.password)
    if(!isMatched) {
        throw new Error("Invalid login credintials");
    }

    return user;
} 


userSchema.pre("save", async function(next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre("remove", async function (next) {
    const user = this;

    await Task.deleteMany({owner: user._id});

    next();
})

const User = mongoose.model("User", userSchema);

module.exports = User;