import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data.sqlite',
  logging: false
});

export default sequelize; 