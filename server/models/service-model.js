const {Schema, model} = require("mongoose");

const serviceSchema = new Schema({
    name:{ type: String, required: true },
    category:{ type: String, required: true },
    level: { type: String, required: true },
    duration:{ type: String, required: true },
    instructor:{ type: String, required: true },
});

const ServiceM = new model("Service", serviceSchema);
module.exports = ServiceM;