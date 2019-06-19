// This table is used to store all groups entries. Although the primary key is id, applications should enforce that the name field stays unique.
module.exports = function(sequelize, DataTypes) {
  let AdminGroup = sequelize.define('AdminGroup', {
	  id : { // 	Unique integer identifying the row.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	autoIncrement: true,
	  	notNull: true
	  },
	  flags : { // 	Permissions flag string.
	  	type : DataTypes.STRING(30),
	  	notNull: true
	  },
	  name : { // 	Unique name of the group.
	  	type : DataTypes.STRING(120),
	  	notNull: true
	  },
	  immunity_level : { // 	Immunity level value.
	  	type : DataTypes.INTEGER(1).UNSIGNED,
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_groups'
  });
  return AdminGroup;
};