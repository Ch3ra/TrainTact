const { upload } = require("./../middleware/multerConfig"); 
const router = require("express").Router();
const chatController = require("../controller/chatController/chatController")
const { chatUpload } = require("./../middleware/multerConfig");

router.post('/addConversation', chatController.createConversation)
router.get('/getMessage/:id', chatController.getMessages)
router.get('/getConversation/:id', chatController.getConversations)
router.put('/changeStatus', chatController.markMessagesAsRead)
router.post('/sendMessage', chatUpload.array('files', 5), chatController.sendMessage);

module.exports= router