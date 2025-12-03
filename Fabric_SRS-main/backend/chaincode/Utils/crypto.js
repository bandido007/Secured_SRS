const crypto = require('crypto');

exports.hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
