import { Router } from 'express';
import { analyzePost, analyzeReelById, analyzeProfile, analyzeStory, getResults, getCreatorStats, getTrendingCreators, exportResults, shareToInstagram } from './controllers/videoController.js';

export const router = Router();

router.get('/analyze/post', analyzePost);
router.get('/analyze/reel/:reelId', analyzeReelById);
router.post('/analyze/profile', analyzeProfile);
router.get('/analyze/story/:username/:storyId', analyzeStory);
router.get('/results/:postId', getResults);
router.get('/creator/:username/stats', getCreatorStats);
router.get('/trending/ai-creators', getTrendingCreators);
router.get('/export/:postId', exportResults);
router.post('/share/instagram', shareToInstagram);
