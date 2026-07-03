const express = require('express');
const { aiGenerateTasks } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/:id/ai-generate', aiGenerateTasks);

module.exports = router;