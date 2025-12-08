import { Router } from "express";
import { getCampaigns } from "../controllers/campaignController";
import { rateLimiter } from "../middleware";

const router = Router();

router.use(rateLimiter());

// Get campaigns from n8n webhook
router.get("/campaigns", getCampaigns);

export default router;
