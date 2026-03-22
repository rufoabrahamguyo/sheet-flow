import mongoose from "mongoose";

export const initializeDB = async() => {
    const uri = process.env.MONGO_URI || 'mongouri'

    if(!uri){
        console.error((err) => {
            console.error('URI not found', err);
        })
    }

    try {
        await mongoose.connect(uri)
        console.log('Connection to cloud database established')
    } catch (error) {
        console.error('Error connecting to cloud DB:', error.message)
    }
}