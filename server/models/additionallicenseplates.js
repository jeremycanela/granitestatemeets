'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdditionalLicensePlates extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Users, {
        foreignKey: "userId",
        as: "additionalLicensePlates"
      });
    }
  }
  AdditionalLicensePlates.init({
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER
    },
    userId: DataTypes.UUID,
    licensePlate: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AdditionalLicensePlates',
  });
  return AdditionalLicensePlates;
};