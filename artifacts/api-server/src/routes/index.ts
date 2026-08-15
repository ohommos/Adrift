import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { identityRouter } from "./identity";
import { bottlesRouter } from "./bottles";
import { citiesRouter } from "./cities";
import { notificationsRouter } from "./notifications";
import { proRouter } from "./pro";

const router: IRouter = Router();

router.use(healthRouter);
router.use(identityRouter);
router.use(bottlesRouter);
router.use(citiesRouter);
router.use(notificationsRouter);
router.use(proRouter);

export default router;
