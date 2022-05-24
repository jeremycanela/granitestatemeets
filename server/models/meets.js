'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Meets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.MeetRequests, {foreignKey: "meetId", as: "meets"});
    }
  }
  Meets.init({
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      title: DataTypes.STRING,
      date: DataTypes.DATEONLY,
      time: DataTypes.TIME,
      location: DataTypes.STRING,
      announcement: DataTypes.TEXT,
      privateMeet: DataTypes.BOOLEAN,
      limit: DataTypes.INTEGER,
      backupLocation: DataTypes.STRING,
      endTime: DataTypes.TIME
    }, {
    sequelize,
    modelName: 'Meets',
  });
  return Meets;
};