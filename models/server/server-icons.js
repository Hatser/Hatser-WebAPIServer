/*
 Store Roles. 
*/
module.exports = function(sequelize, DataTypes) {
	let ServerIcons = sequelize.define('ServerIcons', {
	  icon_id : { // 아이콘의 고유 ID
	  	type : DataTypes.INTEGER(10).UNSIGNED, 
	  	primaryKey: true, 
	  	autoIncrement: true,
	  	notNull: true
	  },
		server_id: {
			type : DataTypes.INTEGER(10).UNSIGNED,
			notNull: true
		},
	  icon_type : { // 아이콘의 타입이 들어감, image는 이미지 파일을 불러오고, font는 폰트효과로 아이콘을 표시한다.(Font Awesome 이용)
			type : DataTypes.ENUM('image','font'),
			defaultValue: 'font',
	  	notNull: true
	  },
		icon_content : {
			type: DataTypes.STRING(128),
			defaultValue: 'fas fa-server',
			notNull: true,
			notEmpty: true
		}
	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'sm_server_icons',
		classMethods: {
			associate: function(models) {
				ServerIcons.belongsTo(models.Server, {
					onDelete: 'CASCADE',
					foreignKey: {
						name:'server_id',
						allowNull: false
					}
				});
			}
		}
	});
	
	return ServerIcons;
};