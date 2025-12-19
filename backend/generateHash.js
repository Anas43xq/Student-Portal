const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('\n=== Password Hash Generated ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this SQL to create admin user:');
  console.log(`INSERT INTO users (username, password, email, role) VALUES ('admin', '${hash}', 'admin@studentportal.com', 'admin');`);
  console.log('\n===============================\n');
});
