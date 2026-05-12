const crypto = require('crypto');
const password = 'zk2024';
const salt = 'zk_salt_2024';
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
console.log('Hash for "zk2024":', hash);
