// This table is used to specify group-based command overrides.
module.exports = function(sequelize, DataTypes) {
  let AdminGroupOverride = sequelize.define('AdminGroupOverride', {
	  group_id : { // 	Reference to the sm_groups.id field. Specifies the group the override is for.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	notNull: true
	  },
	  type : { // 	Specifies whether the override is a command or a command group.
	  	type : DataTypes.ENUM('command','group'),
	  	primaryKey: true,  
	  	notNull: true
	  },
	  name : { // 	Command name.
	  	type : DataTypes.STRING(32),
	  	primaryKey: true, 
	  	notNull: true
	  },
	  access : { // 	Whether the command is allowed or denied to this group.
	  	type : DataTypes.ENUM('allow','deny'), 
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_group_overrides'
  });
  return AdminGroupOverride;
};