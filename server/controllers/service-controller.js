const ServiceM = require("../models/service-model");

const services = async (req, res) => {
try{
const response = await ServiceM.find();
if(!response){
    res.status(404).json({msg: "No service page found"});
    return;
    }
res.status(200).json({msg: response});
}catch(error){
    console.log("service page error:",error);
}
}
module.exports = services;