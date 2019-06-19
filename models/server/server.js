module.exports = function(sequelize, DataTypes) {
	let Server = sequelize.define('Server', {
		id : {
			type : DataTypes.INTEGER(10).UNSIGNED, 
			primaryKey: true, 
			autoIncrement: true,
			notNull: true
		},
		address : {
			type : DataTypes.STRING(65),
			notNull: true,
			validate: {
				isIPv4orDomain(value) {
					if(!(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(value)
					||	(/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i.test(value) // 유효한 문자들로 구성되어 있는지 확인한다
					&& /^.{1,253}$/.test(value) // 전체 길이를 확인한다.
					&& /^[^.]{1,63}(\.[^.]{1,63})*$/.test(value)) // 각 레이블의 길이를 확인한다.
					)) {
						throw new Error('Only IPv4 and Domain Name values are allowed!');
					}
				}
			},
			unique: 'uniq'
		}, 
		port : {
			type : DataTypes.INTEGER(5).UNSIGNED,
			notNull: true,
			validate: {min: 0, max: 65535},
			unique: 'uniq'
		},
		displayname : {
			type : DataTypes.STRING(65),
			notNull: true,
			defaultValue: ''
		}
	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'sm_servers',
		classMethods: {
			associate: function(models) {
				Server.hasOne(models.ServerIcons, {foreignKey: 'server_id'});
			}
		}
	});
	return Server;
};