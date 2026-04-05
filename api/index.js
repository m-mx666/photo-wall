const crypto = require('crypto');

module.exports = (req, res) => {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filename = req.query.filename;

  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  // 阿里云 OSS 配置
  const config = {
    accessKeyId: process.env.OSS_AK_ID,
    accessKeySecret: process.env.OSS_AK_SECRET,
    bucket: 'mmxzyx-picture',
    region: 'oss-cn-beijing'
  };

  if (!config.accessKeyId || !config.accessKeySecret) {
    return res.status(500).json({ error: 'OSS credentials not configured' });
  }

  const expiration = new Date(Date.now() + 3600 * 1000).toISOString();

  const policy = Buffer.from(JSON.stringify({
    expiration,
    conditions: [
      ['content-length-range', 0, 104857600],
      { bucket: config.bucket },
      { key: filename }
    ]
  })).toString('base64');

  const signature = crypto
    .createHmac('sha1', config.accessKeySecret)
    .update(policy)
    .digest('base64');

  res.json({
    signature,
    policy,
    accessKeyId: config.accessKeyId,
    bucket: config.bucket,
    host: `https://${config.bucket}.oss-${config.region}.aliyuncs.com`,
    key: filename
  });
};
