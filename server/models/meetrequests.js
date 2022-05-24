'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MeetRequests extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Meets, {
        foreignKey: "meetId",
        as: "meets"
      });

      this.belongsTo(models.Users, {
        foreignKey: "userId",
        as: "users"
      });
    }
  }

  MeetRequests.init({
    userId: DataTypes.UUID,
    meetId: DataTypes.UUID,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'MeetRequests',
  });
  return MeetRequests;
};