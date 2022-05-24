'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          max: 26
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      licensePlate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 8]
        }
      },
      vehiclePhoto: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      vehicleModifications: {
        type: Sequelize.TEXT
      },
      securityQuestion: {
        type: Sequelize.STRING
      },
      securityAnswer: {
        type: Sequelize.STRING
      },
      ipAddress: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      denied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

  },
  async down(queryInterface, Sequelize) {
    
  }
};