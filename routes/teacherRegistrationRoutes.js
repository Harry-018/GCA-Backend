import express from "express";
import {
  createRegistrationInvitation,
  verifyRegistrationInvitation,
  submitTeacherRegistration,
} from "../controllers/teacherRegistrationController.js";

const router = express.Router();

router.post("/", createRegistrationInvitation);
router.post("/submit", submitTeacherRegistration);
router.get("/verify/:token", verifyRegistrationInvitation);
export default router;
// 8bc9d38fc043a25cd2ac7f23e87a75eaf84244163c4886bd7cf93fb86997f6ea regis-token

//  "data": {
//         "teacher_id": 120001,
//         "teacher_info_id": 120001,
//         "user_id": 150001,
//         "address_id": 120001
//     }

// "data": {
//         "invitation_id": 150001,
//         "user_id": 150001,
//         "email": "mavisreigntakeshiro@gmail.com",
//         "expires_at": "2026-09-27T05:41:58.491Z"
//     }
// }
