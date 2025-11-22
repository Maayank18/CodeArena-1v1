import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true }, // New
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },    // New
    password: { type: String, required: true, minlength: 7 }, // Min 7 chars
    stats: {
        wins: { type: Number, default: 0 },
        matchesPlayed: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
});

// Encrypt password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;