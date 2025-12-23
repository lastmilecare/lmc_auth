import { Injectable, Logger } from '@nestjs/common';
import { Role } from 'src/models/Roles';
import { UserN as User } from 'src/models/UsersN';
import { Permission } from 'src/models/Permissions';
import { TestAccount } from 'src/models/test-account.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class CenterAuthService {
  private readonly logger = new Logger(CenterAuthService.name);

  constructor(
    @InjectModel(TestAccount)
    private readonly testAccountModel: typeof TestAccount,
  ) { }

  async isTestAccountByEmail(email: string): Promise<boolean> {
    try {
      const testAccount = await this.testAccountModel.findOne({
        where: { email, isTestAccount: true },
      });
      return !!testAccount;
    } catch (error) {
      this.logger.error('Error checking test account by email', error.stack);
      throw error;
    }
  }

  /**
   * Get a test account by email address
   */
  async getTestAccountByEmail(email: string): Promise<TestAccount | null> {
    try {
      return await this.testAccountModel.findOne({
        where: { email, isTestAccount: true },
      });
    } catch (error) {
      this.logger.error('Error getting test account by email', error.stack);
      throw error;
    }
  }

  /**
   * Verify test account password (plain text)
   */
  async verifyTestAccountPassword(
    email: string,
    password: string,
  ): Promise<boolean> {
    try {
      const testAccount = await this.testAccountModel.findOne({
        where: { email, isTestAccount: true },
      });

      if (!testAccount) {
        return false;
      }

      // Plain text comparison (as per your original logic)
      return testAccount.password === password;
    } catch (error) {
      this.logger.error('Error verifying test account password', error.stack);
      throw error;
    }
  }

  /**
   * Create or update a test account
   */
  async createOrUpdateTestAccountByEmail(
    email: string,
    password: string,
    description?: string,
  ): Promise<TestAccount> {
    try {
      const [testAccount, created] =
        await this.testAccountModel.findOrCreate({
          where: { email },
          defaults: {
            email,
            password,
            isTestAccount: true,
            description:
              description ||
              'Test account for email/password authentication',
          },
        });

      if (!created) {
        testAccount.password = password;
        testAccount.isTestAccount = true;
        testAccount.description =
          description || testAccount.description;
        await testAccount.save();
      }

      return testAccount;
    } catch (error) {
      this.logger.error(
        'Error creating or updating test account',
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete test account by email
   */
  async deleteTestAccountByEmail(email: string): Promise<boolean> {
    try {
      const deleted = await this.testAccountModel.destroy({
        where: { email },
      });
      return deleted > 0;
    } catch (error) {
      this.logger.error('Error deleting test account', error.stack);
      throw error;
    }
  }

  /**
   * Get all test accounts
   */
  async getAllTestAccounts(): Promise<TestAccount[]> {
    try {
      return await this.testAccountModel.findAll({
        where: { isTestAccount: true },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      this.logger.error('Error getting all test accounts', error.stack);
      throw error;
    }
  }

  async checkRole(permission_id) {
    try {
      return await Permission.findOne({
        where: { id: permission_id },
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async getRole(slug) {
    try {

      return await Role.findOne({
        where: { slug: slug },

        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async getLastId(getRole) {
    try {

      return await User.findOne({
        where: { role_id: getRole.id },
        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async createUser(data) {
    try {
      return await User.create(data);
    } catch (error) {
      throw new Error(error);
    }
  }


}
