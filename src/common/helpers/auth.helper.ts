import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { UserN as User } from 'src/models/UsersN';
import { UserLog as userlog } from 'src/models/user-log.model';
import { Cetuser as Cetuser } from 'src/models/CetUser';

import {
  JWT_ADMIN as configJwttoken,
  JWT_CENTER as configJwttokenCenter,
} from 'config/envConfig';
import { CorporateUser } from 'src/models/corporate-user';

/**
 * ADMIN LOGIN
 */
type TokenResponse = {
  token?: string;
  role?: any;
  username?: any;
  isAdmin?: any;
  permission?: any;
  user_id?: any;
  status?: any;
  cet_id?: any;
  isCet?: any;
  email?: any;
  name?: any;
  permissions?: any;
  tenantId?: any;
};

export const checkUserPass = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  const passwordIsValid = await bcrypt.compare(password, userdata.password);

  if (!passwordIsValid) {
    return { status: 'invalid_password' };
  }

  const token = jwt.sign({ data: { id: userdata.id } }, configJwttoken, {
    expiresIn: '10d',
  });

  res.setHeader(
    'Set-Cookie',
    cookie.serialize('token', token, {
      maxAge: 10 * 24 * 60 * 60,
      httpOnly: true,
    }),
  );

  return {
    token,
    role: userdata.role,
    username: userdata.username,
    isAdmin: userdata.isAdmin,
    permission: userdata.permission || null,
    permissions: userdata.permissions || null,
    user_id: userdata.id || null,
    status: true,
    email: userdata.email || null,
    name: userdata.name || null,
  };
};

/**
 * CENTER LOGIN
 */
export const checkUserPassCenter = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  try {
    const passwordIsValid = await bcrypt.compare(password, userdata.password);

    if (!passwordIsValid) {
      return { status: 'invalid_password' };
    }

    const token = jwt.sign(
      { data: { id: userdata.id } },
      configJwttokenCenter,
      { expiresIn: '10d' },
    );

    const response = {
      token,
      role: userdata.slug,
      username: userdata.username,
      isAdmin: userdata.isAdmin,
      permission: userdata.permission || null,
      user_id: userdata.id,
      status: true,
    };

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('center_token', token, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }),
    );

    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * EMAIL EXIST CHECK
 */
export const checkEmailExist = async (email: string) => {
  try {
    const exists = await User.findOne({ where: { email } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * USERNAME EXIST CHECK
 */
export const checkUserNameExist = async (username: string) => {
  try {
    const exists = await User.findOne({ where: { username } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * PHONE EXIST CHECK
 */
export const checkPhoneExist = async (phone: string) => {
  try {
    const exists = await User.findOne({ where: { phone } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * CET LOGIN
 */
export const checkUserPassCet = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  try {
    const passwordIsValid = await bcrypt.compare(password, userdata.password);

    if (!passwordIsValid) {
      return { status: 'invalid_password' };
    }

    const cetUser = await Cetuser.findOne({
      where: { user_id: userdata.id },
    });

    const corUser = await CorporateUser.findOne({
      where: { user_id: userdata.id },
    });
    if (!cetUser && !corUser) {
      return { status: 'no_cet_id_found' };
    }
    const cet_id = cetUser?.cet_id || corUser?.dataValues?.corporate_id;
   
    const token = jwt.sign(
      {
        data: {
          id: userdata.id,
          cet_id: cet_id,
        },
      },
      configJwttokenCenter,
      { expiresIn: '1000d' },
    );

    const response = {
      token,
      role: userdata.slug,
      username: userdata.username,
      isAdmin: false,
      permission: userdata.permissions || null,
      cet_id: cetUser?.dataValues?.cet_id || cetUser?.cet_id || null,
      isCet: true,
      status: true,
      role_id: userdata.role_id || null,
      user_id: userdata.id || null,
      corporate_id: corUser?.dataValues?.corporate_id || null,
    };
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('cet_token', token, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }),
    );

    return response;
  } catch (error) {
    throw error;
  }
};

export const createUserLogs = async (data: {
  user_id: any;
  action_type: any;
  action_description: any;
  user_ip?: any;
  action_time?: any;
}) => {
  try {
    await userlog.create({
      user_id: data.user_id,
      action_type: data.action_type,
      action_description: data.action_description,
      user_ip: data.user_ip,
      action_time: data.action_time || new Date(),
    });
  } catch (error) {
    throw error;
  }
};

// export const getCenterId = async (id: number) => {
//   try {
//     return await Centeruser.findOne({ where: { user_id: id }, raw: true, nest: true });
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCetId = async (id: number) => {
//   try {
//     return await Cetuser.findOne({ where: { user_id: id }, raw: true, nest: true });
//   } catch (error) {
//     throw error;
//   }
// };

// export const assignCetToUser = async (
//   req: any,
//   res: any,
//   getData: any,
// ) => {
//   try {
//     const { username, name, phone, email, password, cet_id } = req.body;

//     const phoneNumber = String(phone).trim();
//     const trimmedUsername = username.trim().toLowerCase();
//     const trimmedEmail = email.toLowerCase();

//     // Check if user already exists
//     const existingUser = await User.findOne({ where: { username: trimmedUsername } });
//     if (existingUser) {
//       throw new Error('Username already exists');
//     }

//     // Hash password asynchronously
//     const hashedPassword = await bcrypt.hash(password, 8);

//     // Create user
//     const userInsert = await User.create({
//       username: trimmedUsername,
//       name,
//       phone: phoneNumber,
//       email: trimmedEmail,
//       role_id: getData.role_id,
//       permission_id: getData.id,
//       status: true,
//       isAdmin: false,
//       password: hashedPassword,
//     });

//     // Assign CET to user
//     const userData = await Cetuser.create({
//       user_id: userInsert.id,
//       cet_id: cet_id,
//     });

//     return { userData, userInsert };
//   } catch (error) {
//     throw new Error(`Failed to assign CET to user: ${error.message}`);
//   }
// };

export const checkUserPassB2C = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  const passwordIsValid = await bcrypt.compare(password, userdata.password);

  if (!passwordIsValid) {
    return { status: 'invalid_password' };
  }
  const token = jwt.sign(
    {
      data: {
        id: userdata.id,
        email: userdata.email,
        tenantId: userdata.tenantId,
        role: userdata.role,
        permissions: userdata.permissions,
      },
    },
    configJwttoken,
    {
      expiresIn: '10d',
    },
  );

  res.setHeader(
    'Set-Cookie',
    cookie.serialize('token', token, {
      maxAge: 10 * 24 * 60 * 60,
      httpOnly: true,
    }),
  );

  return {
    token,
    role: userdata.role,
    username: userdata.username,
    isAdmin: userdata.isAdmin,
    permission: userdata.permission || null,
    permissions: userdata.permissions || null,
    user_id: userdata.id || null,
    status: true,
    email: userdata.email || null,
    name: userdata.name || null,
    tenantId: userdata.tenantId || null,
  };
};
