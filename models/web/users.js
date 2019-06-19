/*
 Store user info. 
*/
module.exports = function(sequelize, DataTypes) {
	let WebUsers = sequelize.define('WebUsers', {
		user_id : { // 유저의 고유 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			primaryKey: true, 
			autoIncrement: true,
			notNull: true
		},
		identity : { // 유저의 고유번호(STEAMID 32)
			type : DataTypes.STRING(65),
			notEmpty: true,
			notNull: true
			
		},
		name : { // 유저의 별명(alias)
			type : DataTypes.STRING(65),
			notNull: true
		},

	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'web_users',

		classMethods: {
			associate: function(models) {
				WebUsers.hasMany(models.WebUserRoles, {foreignKey: 'user_id'});
			}
		}
	});
	return WebUsers;
};