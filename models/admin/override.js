// This table is used to specify global command overrides.
module.exports = function(sequelize, DataTypes) {
  let AdminOverride = sequelize.define('AdminOverride', {
	  type : { // 	Specifies whether the override is a command or a command group.
	  	type : DataTypes.ENUM('command','group'),
	  	primaryKey: true,  
	  	notNull: true
	  },
	  name : { // Command name.
	  	type : DataTypes.STRING(32),
	  	primaryKey: true, 
	  	notNull: true
	  },
	  flags : { // Permissions flag string.
	  	type : DataTypes.STRING(30), 
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_overrides'
  });
  return AdminOverride;
};