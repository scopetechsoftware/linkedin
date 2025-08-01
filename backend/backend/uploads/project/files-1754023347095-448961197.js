const mongoose = require('mongoose')

const userschema = new mongoose.Schema({

    // common details
    name:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required: true
    },
    phoneNumber:{
        type:Number,
        required: true
    },
    role:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    skill:{
        type:String,
       
    },
    goal:{
        type:String,
        
    },
    interest:{
        type:String,
        
    },
    // employee model
    
  
    domain:{
        type:String,
    
    },

    // student

    degree:{
        type:String,
    
    },
    year:{
        type:String,
       
    },

    // freelancer

    project:{
        type:Number,
        
    },
    Role:{
        type:String
    },

    // employer

    companyName:{
        type:String,
        
    },
    address:{
        type:String,
    
    },

    websitelink:{
        type:String,
    },
    linkedin:{
        type:String
    },
    facebook:{
        type:String
    },
    instagram:{
        type:String
    },
    github:{
        type:String
    },

    // university
    collegename:{
        type:String,
       
    },

    // professor
    department:{
        type:String,
        
    },
    experience:{
        type:String,
        
    }
    
},{timestamps:true})

module.exports = mongoose.model('user',userschema)