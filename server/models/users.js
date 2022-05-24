'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.MeetRequests, {foreignKey: "userId", as: "users"});
      this.hasMany(models.AdditionalLicensePlates, {foreignKey: "userId", as: "additionalLicensePlates"});
      this.hasMany(models.ForgotPasswordLinks, {foreignKey: "userId", as: "passwordSecurity"})
    }
  }
  Users.init({
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      email: DataTypes.STRING,
      fullName: DataTypes.STRING,
      password: DataTypes.STRING,
      licensePlate: DataTypes.STRING,
      vehiclePhoto: DataTypes.STRING,
      vehicleModifications: DataTypes.TEXT,
      securityQuestion: DataTypes.STRING,
      securityAnswer: DataTypes.STRING,
      ipAddress: DataTypes.STRING,
      verified: DataTypes.BOOLEAN,
      denied: DataTypes.BOOLEAN,
      banned: DataTypes.BOOLEAN,
      admin: DataTypes.BOOLEAN,
      additionalVehiclePhoto: DataTypes.STRING
    }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};