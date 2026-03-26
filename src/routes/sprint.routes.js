import express from 'express'
import {createSprint , updateSprintStatus} from '../controllers/sprint.controller.js'
import {protect} from '../middlewares/auth.middleware.js'


const router = express.Router()

router.use(protect);

router.post('/', createSprint);
router.patch('/:sprintId/status', updateSprintStatus);

export default router;