let PERMISSIONS_MAP: Record<number, string> = {};

export const loadPermissionsMap = async (permissionModel: any) => {
  const permissions = await permissionModel.findAll();
  PERMISSIONS_MAP = {};
  permissions.forEach((p: any) => {
    PERMISSIONS_MAP[p.id] = `${p.action}:${p.resource}`;
  });
};

export const getPermissionsMap = () => PERMISSIONS_MAP;