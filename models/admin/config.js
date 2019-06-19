// This table is used to specify configuration options.
module.exports = function(sequelize, DataTypes) {
  let AdminConfig = sequelize.define('AdminConfig', {
	  cfg_key : { // 	Configuration key.
	  	type : DataTypes.STRING(32), 
	  	primaryKey: true, 
	  	notNull: true
	  },
	  cfg_value : { // Configuration value.
	  	type : DataTypes.STRING(255), 
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_config'
  });
  return AdminConfig;
};