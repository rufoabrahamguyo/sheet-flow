import mongoose from "mongoose";



const UserSchema = new mongoose.Schema({
  firstName: {
    type: String, 
    required : [true, 'First Name required'],
    trim: true
},
  lastName: {
    type: String,
    required: [true, 'Last Name required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 6
  }
},{
  timestamps: true
})

export const User = mongoose.model('user', UserSchema)