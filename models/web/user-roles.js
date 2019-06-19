/*
 Store The Roles Of users Because each user can have more than one Role.
*/
module.exports = function(sequelize, DataTypes) {
	let WebUserRoles = sequelize.define('WebUserRoles', {
		user_role_id : { // 유저당 역할의 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			primaryKey: true, 
			autoIncrement: true,
			notNull: true
		},
		user_id : { // 역할이 배정될 유저 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			notNull: true
		}, 
		role_id : { // 유저에 배정될 역할 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			notNull: true
		}
	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'web_user_roles',
		
		classMethods: {
			associate: function(models) {
				WebUserRoles.belongsTo(models.WebUsers, {
					onDelete: 'CASCADE',
					foreignKey: {
						name:'user_id',
						allowNull: false
					}
				});

				WebUserRoles.belongsTo(models.WebRoles, {
					onDelete: 'CASCADE',
					foreignKey: {
						name:'role_id',
						allowNull: false
					}
				});
			}
		}
	});
	return WebUserRoles;
};