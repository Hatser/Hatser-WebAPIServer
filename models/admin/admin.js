// This table is used to store administrators. Although the primary key is id, applications should enforce that authtype and identity have no combined duplicates.
module.exports = function(sequelize, DataTypes) {
	let Admin = sequelize.define('Admin', {
	  id : { // 	Unique integer identifying the row.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	autoIncrement: true,
	  	notNull: true
	  },
	  authtype : { // Authentication type the identity is against.
	  	type : DataTypes.ENUM('steam','name','ip'),
	  	notNull: true,
	  }, 
	  identity : { // 	Steam ID, name, or IP address.
	  	type : DataTypes.STRING(65),
	  	notNull: true,
	  	notEmpty: true
	  },
	  password : { // 	password [optional]
	  	type : DataTypes.STRING(65)
	  },
	  flags : { // 	permission flags to assign.
	  	type : DataTypes.STRING(30),
	  	notNull: true
	  },
	  name : { // alias name for distinguishing ...
	  	type : DataTypes.STRING(65),
	  	notNull: true
	  },
	  immunity : { // command immunity value.
	  	type : DataTypes.INTEGER(10).UNSIGNED,
	  	notNull: true
	  }
	},
	{
	timestamps: false,
	charset: 'utf8',
	tableName: 'sm_admins',
	classMethods: {
		associate: function(models) {
			Admin.hasOne(models.AdminServer, {foreignKey: 'admin_id'});
		}
	}
});
	return Admin;
};