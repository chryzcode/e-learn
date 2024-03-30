import "dotenv/config"
import express from "express";


const PORT = process.env.PORT || 8000

const app = express()


const start = async () => {
    
    app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
    })
}




