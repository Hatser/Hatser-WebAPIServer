/*
 Store Permissions For every Roles.
*/
module.exports = function(sequelize, DataTypes) {
	let WebRolePermissions = sequelize.define('WebRolePermissions', {
		role_permission_id : { // 역할당 권한의 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			primaryKey: true, 
			autoIncrement: true,
			notNull: true
		},
		role_id : { // 권한이 배정될 역할 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			notNull: true
		}, 
		permission_id : { // 역할에 배정될 권한 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			notNull: true
		}
	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'web_role_permissions',

		classMethods: {
			associate: function(models) {
				WebRolePermissions.belongsTo(models.WebPermissions, {
					onDelete: 'CASCADE',
					foreignKey: {
						name:'permission_id',
						allowNull: false
					}
				});

				WebRolePermissions.belongsTo(models.WebRoles, {
					onDelete: 'CASCADE',
					foreignKey: {
						name:'role_id',
						allowNull: false
					}
				});
			}
		}
	});
	return WebRolePermissions;
};