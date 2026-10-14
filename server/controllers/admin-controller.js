const User = require("../models/user-model");
const Contact = require("../models/contact-model");


//Getting all users from db
const getAllUsers = async(req,res) =>{
try {
const users= await User.find({},{password:0});
console.log(users);
    if(!users || users.length === 0){
        return res.status(404).json({message: "page not found"});
    }

    res.status(200).json(users);
} catch (error) {
    next(error);
}
}

//getting a user by id
const getUserByID = async( req, res) =>{
try {
    const id = req.params.id;
   const data = await User.findOne({_id: id}, {password:0});
    return res.status(200).json(data);
} catch (error) {
    next(error);
}
}
//updating a user by id
const updateUserByID = async( req, res) =>{
    try {
        const id = req.params.id;
        const updatedUserData = req.body;
       const updatedData = await User.updateOne({_id: id}, {
        $set: updatedUserData});

        return res.status(200).json(updatedData);
    } catch (error) {
        next(error);
    }
    }

//Getting all contacts page data from db
const getAllContacts = async (req,res) =>{
    try {
        const contacts = await Contact.find();
        if (!contacts || contacts.length===0){
           return res.status(404).json({message: "Contact list not found"});
        }
        return res.status(200).json(contacts);
    } catch (error) {
        next(error)
    }
}


//delete a user by id
const deleteUserByID = async( req, res) =>{
    try {
        const id = req.params.id;

        await User.deleteOne({_id: id});
        return res.status(200).json({message: "User deleted successfully"});
    } catch (error) {
        next(error);
    }
    }

//delete a contact by id
    const deleteContactByID = async( req, res) =>{
        try {
            const id = req.params.id;
            await Contact.deleteOne({_id: id});
            return res.status(200).json({message: "Contact deleted successfully"});
        } catch (error) {
            next(error);
        }
        }

module.exports= {getAllUsers, getAllContacts, deleteUserByID, getUserByID, updateUserByID, deleteContactByID};