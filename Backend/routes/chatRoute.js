const { upload } = require("./../middleware/multerConfig"); 
const router = require("express").Router();
const chatController = require("../controller/chatController/chatController")

router.post('/addConversation', chatController.createConversation)
router.post('/sendMessage', chatController.sendMessage)
router.get('/getMessage/:id', chatController.getMessages)
router.get('/getConversation/:id', chatController.getConversations)
router.put('/changeStatus', chatController.markMessagesAsRead)

module.exports= router