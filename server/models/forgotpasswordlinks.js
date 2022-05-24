'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ForgotPasswordLinks extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Users, {
        foreignKey: "userId",
        as: "passwordSecurity"
      });
    }
  }
  ForgotPasswordLinks.init({
    path: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    userId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'ForgotPasswordLinks',
  });
  return ForgotPasswordLinks;
};