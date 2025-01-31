require('dotenv').config();

const createApp = require('./app');

const PORT = process.env.PORT || 3000;

const main = async () => {
  const app = await createApp(process.env.DB_TYPE);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
main();