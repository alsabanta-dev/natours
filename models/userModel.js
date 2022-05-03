const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name feild is required!"],
    },
    email: {
        type: String,
        required: [true, "Email field is required!"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email!']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Password field is required!'],
        minLength: 4,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password Confirmation field is required!'],
        validate: {
            // This ony work on CREATE & SAVE!!
            validator: function(el){
                return el === this.password
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type:Boolean,
        default: true,
        select: false
    }
},
{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
},
)

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)

    this.passwordConfirm = undefined

    next()
})

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next()

    this.passwordChangedAt = Date.now() - 1000
    next()

})

userSchema.pre(/^find/, function(next){
    // this point to the current query
    this.find({active: { $ne: false}})
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimpstamp = parseInt(this.passwordChangedAt.getTime()/1000, 10)
        return JWTTimestamp < changedTimpstamp
    }
    return false
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires  = Date.now() + 10*60*1000

    console.log(resetToken, this.passwordResetToken)

    return resetToken
}

const User = mongoose.model('User', userSchema)
module.exports = User