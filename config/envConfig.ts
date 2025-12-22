// import dotenv from 'dotenv';

const dotenv = require('dotenv');
dotenv.config();

const port: number = parseInt(process.env.PORT || '3000', 10);
const API_PREFIX_ADMIN: string = process.env.API_PREFIX_ADMIN ;
const API_PREFIX_CENTER: string = process.env.API_PREFIX_CENTER ;
const API_PREFIX_CET: string = process.env.API_PREFIX_CET ;
const API_PREFIX_DOCTOR: string = process.env.API_PREFIX_DOCTOR ;

// Database
const databaseName: string = process.env.DB_NAME ;
const userName: string = process.env.DB_USERNAME ;
const password: string = process.env.DB_PASSWORD ;
const host: string = process.env.DB_HOST ;
const portDb: number = parseInt(process.env.DB_PORT , 10);
const JWT_ADMIN: string = process.env.JWT_ADMIN ;
const JWT_CENTER: string = process.env.JWT_CENTER ;

// Email
const emailFrom: string = process.env.EMAIL_FROM ;

// S3
const S3AccessId: string = process.env.S3AccessId;
const SecretId: string = process.env.SecretId;
const BUCKET_NAME: string = process.env.BUCKET_NAME;


// Banner S3
const S3AccessKey: string = process.env.S3AccessKey;
const SecretKey: string = process.env.SecretKey;
const BUCKET_NAME_BANNER: string = process.env.BUCKET_NAME_BANNER;
const BUCKET_NAME_PRESCRIPTION: string = process.env.BUCKET_NAME_PRESCRIPTION; 
const AWS_REGION:string = process.env.AWS_REGION;
const BUCKET_NAME_RECORDING :string = process.env.BUCKET_NAME_RECORDING
const BUCKET_NAME_PATIENT_ID_PROOF :string = process.env.BUCKET_NAME_PATIENT_ID_PROOF
 

// Other Keys
const secretKey: string = process.env.SECRET_KEY ;
const anotherKey: string = process.env.ANOTHER_KEY ;

const TWILIO_ACCOUNT_SID: string = process.env.TWILIO_ACCOUNT_SID ;
const TWILIO_AUTH_TOKEN: string = process.env.TWILIO_AUTH_TOKEN ;
const TWILIO_PHONE_NUMBER: string = process.env.TWILIO_PHONE_NUMBER ;

const WP_TWILIO_ACCOUNT_SID: string = process.env.WP_TWILIO_ACCOUNT_SID ;
const WP_TWILIO_AUTH_TOKEN: string = process.env.WP_TWILIO_AUTH_TOKEN ;
const WP_TWILIO_PHONE_NUMBER: string = process.env.WP_TWILIO_PHONE_NUMBER ;
const WP_TWILIO_PHONE_NUMBER_TEMP: string = process.env.WP_TWILIO_PHONE_NUMBER_TEMP ;

const TEST_TWILIO_API_KEY_SID: string = process.env.TEST_TWILIO_API_KEY_SID ;
const TEST_TWILIO_API_KEY_SECRET: string = process.env.TEST_TWILIO_API_KEY_SECRET ;
const TEST_TWILIO_ACCOUNT_SID: string = process.env.TEST_TWILIO_ACCOUNT_SID ;

const TWILIO_API_KEY_SID: string = process.env.TWILIO_API_KEY_SID ;
const TWILIO_API_KEY_SECRET: string = process.env.TWILIO_API_KEY_SECRET ;


const DAILY_API_KEY: string = process.env.DAILY_API_KEY ;

// PDF template selection via center group
const PRESCRIPTION_GOV_GROUP_NAME: string = process.env.PRESCRIPTION_GOV_GROUP_NAME || 'Group 1';

const prefix = {
  admin: API_PREFIX_ADMIN,
  center: API_PREFIX_CENTER,
  cet: API_PREFIX_CET,
  doctor: API_PREFIX_DOCTOR
};

const dialectOptions = {
  ssl: {
    require: false,
    rejectUnauthorized: false
  }
};

const abdmConfig = {
  clientId: process.env.ABDM_CLIENT_ID,
  clientSecret: process.env.ABDM_CLIENT_SECRET,
};

// Firebase Configuration
const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
};

// JSL Integration (LMC)
const jslLmcConfig = {
  url: process.env.JSL_LMC_URL,
  user: process.env.JSL_LMC_USER,
  password: process.env.JSL_LMC_PASSWORD,
};

// Test Account Configuration
const testAccountConfig = {
  enabled: process.env.TEST_ACCOUNT_ENABLED === 'true',
  defaultTestPhone: process.env.TEST_ACCOUNT_PHONE,
  defaultTestOtp: process.env.TEST_ACCOUNT_OTP ,
  description: 'Default test account for Google Play Store review',
};

// Health Concern Alert System Configuration
const healthConcernConfig = {
  enabled: process.env.HEALTH_CONCERN_ENABLED === 'true',
  autoAnalysis: process.env.HEALTH_CONCERN_AUTO_ANALYSIS === 'true',
  emailService: {
    enabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    from: process.env.EMAIL_FROM || 'noreply@healthmonitoring.com',
  },

  thresholds: {
    bloodSugar: {
      moderate: {
        min: parseInt(process.env.BLOOD_SUGAR_MODERATE_MIN || '141', 10),
        max: parseInt(process.env.BLOOD_SUGAR_MODERATE_MAX || '349', 10),
      },
      high: {
        min: parseInt(process.env.BLOOD_SUGAR_HIGH_MIN || '350', 10),
      },
    },
    bloodPressure: {
      moderate: {
        systolic: {
          min: parseInt(process.env.BLOOD_PRESSURE_MODERATE_SYSTOLIC_MIN || '130', 10),
          max: parseInt(process.env.BLOOD_PRESSURE_MODERATE_SYSTOLIC_MAX || '179', 10),
        },
        diastolic: {
          min: parseInt(process.env.BLOOD_PRESSURE_MODERATE_DIASTOLIC_MIN || '81', 10),
          max: parseInt(process.env.BLOOD_PRESSURE_MODERATE_DIASTOLIC_MAX || '119', 10),
        },
      },
      high: {
        systolic: {
          min: parseInt(process.env.BLOOD_PRESSURE_HIGH_SYSTOLIC_MIN || '180', 10),
        },
        diastolic: {
          min: parseInt(process.env.BLOOD_PRESSURE_HIGH_DIASTOLIC_MIN || '120', 10),
        },
      },
    },
    pulse: {
      moderate: {
        low: {
          min: parseInt(process.env.PULSE_MODERATE_LOW_MIN || '51', 10),
          max: parseInt(process.env.PULSE_MODERATE_LOW_MAX || '59', 10),
        },
        high: {
          min: parseInt(process.env.PULSE_MODERATE_HIGH_MIN || '101', 10),
          max: parseInt(process.env.PULSE_MODERATE_HIGH_MAX || '119', 10),
        },
      },
      high: {
        low: {
          max: parseInt(process.env.PULSE_HIGH_LOW_MAX || '50', 10),
        },
        high: {
          min: parseInt(process.env.PULSE_HIGH_HIGH_MIN || '120', 10),
        },
      },
    },
    hemoglobin: {
      high: {
        max: parseFloat(process.env.HEMOGLOBIN_HIGH_MAX || '7.9'),
      },
    },
  },
};

// Migration Configuration
export const MIGRATION_CONFIG = {
  BATCH_SIZE: process.env.MIGRATION_BATCH_SIZE || '100',
  RETRY_ATTEMPTS: process.env.MIGRATION_RETRY_ATTEMPTS || '3',
  TIMEOUT: process.env.MIGRATION_TIMEOUT || '300000',
  ENABLE_LOGGING: process.env.MIGRATION_ENABLE_LOGGING === 'true',
  ENABLE_BACKUP: process.env.MIGRATION_ENABLE_BACKUP === 'true',
  MAX_CONCURRENT: process.env.MIGRATION_MAX_CONCURRENT || '1',
  PROGRESS_INTERVAL: process.env.MIGRATION_PROGRESS_INTERVAL || '5000',
  ENABLE_PARALLEL: process.env.MIGRATION_ENABLE_PARALLEL === 'true',
  PARALLEL_DELAY: parseInt(process.env.MIGRATION_PARALLEL_DELAY || '0'),
  
  // Source 1 (HSVK) Configuration
  PICASO: {
    HOST: process.env.PICASO_HSVK_DB_HOST || 'localhost',
    PORT: parseInt(process.env.PICASO_HSVK_DB_PORT || '1433'),
    DATABASE: process.env.PICASO_HSVK_DB_NAME || 'picaso_db',
    USER: process.env.PICASO_HSVK_DB_USER || 'sa',
    PASSWORD: process.env.PICASO_HSVK_DB_PASSWORD || '',
    CREATOR_ID: parseInt(process.env.PICASO_HSVK_CREATOR_ID || '99'),
    IS_ACTIVE: process.env.PICASO_HSVK_IS_ACTIVE !== 'false', // Default to true
  },
  
  // Source 2 (AMP) Configuration
  NEW_SOURCE: {
    HOST: process.env.PICASO_AMP_DB_HOST || 'localhost',
    PORT: parseInt(process.env.PICASO_AMP_DB_PORT || '1433'),
    DATABASE: process.env.PICASO_AMP_DB_NAME || 'new_source_db',
    USER: process.env.PICASO_AMP_DB_USER || 'sa',
    PASSWORD: process.env.PICASO_AMP_DB_PASSWORD || '',
    CREATOR_ID: parseInt(process.env.PICASO_AMP_CREATOR_ID || '98'),
    IS_ACTIVE: process.env.PICASO_AMP_IS_ACTIVE !== 'false', // Default to true
  },
};


export {
  port,
  JWT_ADMIN,
  JWT_CENTER,
  prefix,
  databaseName,
  userName,
  password,
  host,
  portDb,
  emailFrom,
  secretKey,
  anotherKey,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  WP_TWILIO_ACCOUNT_SID,
  WP_TWILIO_AUTH_TOKEN,
  WP_TWILIO_PHONE_NUMBER,
  WP_TWILIO_PHONE_NUMBER_TEMP,
  S3AccessId,
  SecretId,
  BUCKET_NAME,
  dialectOptions,
  abdmConfig,
  S3AccessKey,
  SecretKey,
  BUCKET_NAME_BANNER,
  BUCKET_NAME_PRESCRIPTION,
  BUCKET_NAME_RECORDING,
  AWS_REGION,
  firebaseConfig,
  testAccountConfig,
  healthConcernConfig,
  TEST_TWILIO_ACCOUNT_SID,
  TEST_TWILIO_API_KEY_SECRET,
  TEST_TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_API_KEY_SID,
  DAILY_API_KEY,
  PRESCRIPTION_GOV_GROUP_NAME,
  BUCKET_NAME_PATIENT_ID_PROOF,
  jslLmcConfig
};
