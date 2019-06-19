/*
 Store Roles. 
*/
module.exports = function(sequelize, DataTypes) {
  let WebRoles = sequelize.define('WebRoles', {
	  role_id : { // 역할의 고유 ID
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	autoIncrement: true,
	  	notNull: true
	  },
	  role_name : { // 역할이 표시될 이름, translation 값이 들어갈 수 있음
	  	type : DataTypes.STRING(65),
	  	notNull: true,
	  	notEmpty: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'web_roles',

		classMethods: {
			associate: function(models) {
					WebRoles.hasMany(models.WebRolePermissions, {foreignKey: 'role_id'});
					WebRoles.hasMany(models.WebUserRoles, {foreignKey: 'role_id'});
			}
		}
	});
	
  return WebRoles;
};