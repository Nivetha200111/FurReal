module.exports = (req, res) => {
  const { url, force } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Invalid url' });
  }

  let aiProbability = 0.5;
  let label = 'Suspicious';
  let mode = 'fallback';
  const signals = [];

  // Simulate analysis
  if (url.includes('ai') || url.includes('generated')) {
    aiProbability += 0.3;
    signals.push('URL contains AI keyword');
  }

  if (force === 'ai') {
    aiProbability = 0.97;
    signals.push('Forced AI probability for testing');
  } else if (force === 'real') {
    aiProbability = 0.12;
    signals.push('Forced real probability for testing');
  }

  aiProbability = Math.max(0, Math.min(1, aiProbability));
  if (aiProbability > 0.7) {
    label = 'Likely AI';
  } else if (aiProbability > 0.4) {
    label = 'Suspicious';
  } else {
    label = 'Likely Real';
  }

  res.status(200).json({
    summary: {
      aiProbability: parseFloat((aiProbability * 100).toFixed(1)),
      label,
      mode,
      thumbnailUrl: null,
      caption: `Sample Instagram post`,
      authorUsername: 'sample_user',
      postType: 'reel',
    },
    detailedFindings: {
      signals,
      notes: [`Analysis performed in ${mode} mode.`],
    },
  });
};