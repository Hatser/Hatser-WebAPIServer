// This table is used to map which groups are immune from other groups.
module.exports = function(sequelize, DataTypes) {
  let AdminGroupImmunity = sequelize.define('AdminGroupImmunity', {
	  group_id : { // 	Reference to the sm_groups.id field. Specifies the group gaining immunity.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	notNull: true
	  },
	  other_id : { // 	Reference to the sm_groups.id field. Specifies who group_id is becoming immune from.
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	notNull: true
	  }
	},
	{
	  timestamps: false,
	  charset: 'utf8',
	  tableName: 'sm_group_immunity'
  });
  return AdminGroupImmunity;
};