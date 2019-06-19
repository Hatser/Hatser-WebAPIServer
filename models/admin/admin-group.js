// This table is used to map admins to the groups they will inherit.
module.exports = function(sequelize, DataTypes) {
  let AdminAdminGroup = sequelize.define('AdminAdminGroup', {
	  admin_id : { // Reference to the sm_admins.id field. Specifies the admin inheriting the group.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	notNull: true
	  },
	  group_id : { // Reference to the sm_groups.id field. Specifies the group the admin is inheriting.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	notNull: true
	  },
	  inherit_order : { // Order of inheritance for the given admin. Lower means earlier inheritance.
	  	type : DataTypes.INTEGER(10), 
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_admins_groups'
  });
  return AdminAdminGroup;
};