/*
const City = sequelize.define('city', { countryCode: Sequelize.STRING });
const Country = sequelize.define('country', { isoCode: Sequelize.STRING });

// Country 1 <------> * City

// Here we can connect countries and cities base on country code
Country.hasMany(City, {foreignKey: 'countryCode', sourceKey: 'isoCode'});
City.belongsTo(Country, {foreignKey: 'countryCode', targetKey: 'isoCode'});
*/

/*
	WEB_ADM_PERM_GAME_SERVER

	WEB_ADM_PERM_GAME_SERVER_ADMIN

	WEB_ADM_PERM_SERVER_CHAT			// 이 권한과 서버 내  RCon 권한 둘 다 필요하게...?
	WEB_ADM_PERM_SERVER_RCON			// 이 권한과 서버 내  RCon 권한 둘 다 필요하게...?

	WEB_ADM_PERM_WEB_ADMIN

	
	.
	STORE_ADM_PERM_ADD_CATEGORY 	?
	STORE_ADM_PERM_EDIT_CATEGORY	?
	STORE_ADM_PERM_DEL_CATEGORY		?
	
	STORE_ADM_PERM_ADD_ITEM				?
	STORE_ADM_PERM_EDIT_CATEGORY	?
	STORE_ADM_PERM_DEL_CATERGORY	?

 */
//https://www.codeproject.com/Articles/401015/Create-Custom-Permission-in-Object-Level
/*
 Store permissions and have 2two name for permission 
 first is Permission Title For Showing to The users and 
 second is Constant name for Use in Coding Like preview code snippet. 
*/

module.exports = function(sequelize, DataTypes) {
	let WebPermissions = sequelize.define('WebPermissions', {
		permission_id : { // 권한의 고유 ID
			type : DataTypes.INTEGER(10).UNSIGNED, 
			primaryKey: true, 
			autoIncrement: true,
			notNull: true
		},
		permission_name : { // 권한이 표시될 이름, translation 값이 들어갈 수 있음
			type : DataTypes.STRING(65),
			notNull: true,
			notEmpty: true
		}, 
		permission_constant_name : { // 웹에서 권한을 확인할 때 사용할 상수형 이름
			type : DataTypes.STRING(65),
			notNull: true
		}
	},
	{
		timestamps: false,
		charset: 'utf8',
		tableName: 'web_permissions',

		classMethods: {
			associate: function(models) {
				WebPermissions.hasMany(models.WebRolePermissions, {foreignKey: 'permission_id'});
			}
		}
	}
	);

	WebPermissions.findOrCreate({
		where:{permission_constant_name:'WEB_ADM_PERM_GAME_SERVER'},
		defaults:{permission_name:'web.permissions.game_server', permission_constant_name:'WEB_ADM_PERM_GAME_SERVER'}
	});
	WebPermissions.findOrCreate({
		where:{permission_constant_name:'WEB_ADM_PERM_GAME_SERVER_ADMIN'},
		defaults:{permission_name:'web.permissions.game_server_admin', permission_constant_name:'WEB_ADM_PERM_GAME_SERVER_ADMIN'}
	});
	WebPermissions.findOrCreate({
		where:{permission_constant_name:'WEB_ADM_PERM_WEB_ADMIN'},
		defaults:{permission_name:'web.permissions.game_server_admin', permission_constant_name:'WEB_ADM_PERM_WEB_ADMIN'}
	});

	return WebPermissions;
};

/*
SELECT permission_constant_name FROM `web_permissions` p 
JOIN `web_role_permissions` rp ON rp.permission_id = p.permission_id
JOIN `web_roles` r ON rp.role_id = r.role_id
JOIN `web_user_roles` ur ON r.role_id = ur.role_id WHERE ur.user_id = 1
*/
/*
public static bool CheckPermission(string PermissionConstantName)
<pre>{ 
	bool result = false; 
	// Is current visitor logged in?
	if (!HttpContext.Current.User.Identity.IsAuthenticated)
	{ 
		return false;
	} 
	string Username = HttpContext.Current.User.Identity.Name; 
	//if in user permissions you make changes, you have to clear his permission list
	if (Application["AffectedUsers"] != null)
	{ 
		var AffectedUsers = (List<string>) Application["AffectedUsers"];
		if (AffectedUsers.Contains(Username))
		{
			Session["PermissionList"] = null;
			AffectedUsers.Remove(Username);
			Application["AffectedUsers"] = AffectedUsers;
		} 
	} 
	Users CurrentUser = 
		(from user in DataContext.Context.Users where user.Username == Username select user).
			SingleOrDefault(); 
	//return True because SuperAdmin has all the permissions!
	if (CurrentUser.IsSuperAdmin)
	{ 
		return true;
	} 
	if (Session["PermissionList"] == null)
	{
		List<string> PermissionList = (from p in DataContext.Context.Permissions
									   join rp in DataContext.Context.RolePermissions on 
									   p.PermissionID
										   equals
										   rp.PermissionID
									   join r in DataContext.Context.Roles on rp.RoleID 
									   equals r.RoleID
									   join ur in DataContext.Context.UserRoles on r.RoleID 
										   ur.RoleID
									   where ur.UserID == CurrentUser.UserID
									   select p.PermissionConstantName).Distinct().ToList(); 
		Session["PermissionList"] = PermissionList; 
		result = PermissionList.Contains(PermissionConstantName);
	} 
	else 
	{ 
		var PermissionList = (List<string>) Session["PermissionList"]; 
		result = PermissionList.Contains(PermissionConstantName); 
	} 
	return result; 
} 
*/