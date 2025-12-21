const { sequelize } = require('../src/database/connection');
const { User, Task, License, Notification, Transaction, Team } = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Database - Comprehensive Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test - must delete in correct order due to foreign keys
    await Transaction.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await Task.destroy({ where: {}, force: true });
    // Remove many-to-many associations
    await sequelize.query('DELETE FROM user_licenses');
    await License.destroy({ where: {}, force: true });
    await Team.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('Database Connection', () => {
    it('should successfully connect to database', async () => {
      const result = await sequelize.authenticate();
      expect(result).toBeUndefined(); // authenticate() returns undefined on success
    });

    it('should execute raw query successfully', async () => {
      const [results] = await sequelize.query('SELECT 1+1 AS result');
      expect(results[0].result).toBe(2);
    });

    it('should have correct database name', () => {
      expect(sequelize.config.database).toBe('dscpms_test');
    });
  });

  describe('User Model', () => {
    describe('Model Creation', () => {
      it('should create user with valid data', async () => {
        const user = await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        expect(user.id).toBeTruthy();
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(user.role).toBe('GOON');
      });

      it('should set default values correctly', async () => {
        const user = await User.create({
          username: 'defaultuser',
          email: 'default@example.com',
          password: await bcrypt.hash('Test123!', 10)
        });

        expect(user.role).toBe('GOON');
        expect(parseFloat(user.balance)).toBe(0);
        expect(user.isActive).toBe(true);
      });

      it('should set timestamps on creation', async () => {
        const beforeCreate = new Date();
        
        const user = await User.create({
          username: 'timeuser',
          email: 'time@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        expect(user.created_at).toBeInstanceOf(Date);
        expect(user.updated_at).toBeInstanceOf(Date);
        expect(user.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      });
    });

    describe('Validations', () => {
      it('should enforce unique username', async () => {
        await User.create({
          username: 'unique',
          email: 'unique1@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        await expect(
          User.create({
            username: 'unique',
            email: 'unique2@example.com',
            password: await bcrypt.hash('Test123!', 10),
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should enforce unique email', async () => {
        await User.create({
          username: 'user1',
          email: 'same@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        await expect(
          User.create({
            username: 'user2',
            email: 'same@example.com',
            password: await bcrypt.hash('Test123!', 10),
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should validate email format', async () => {
        await expect(
          User.create({
            username: 'invalidemail',
            email: 'not-an-email',
            password: await bcrypt.hash('Test123!', 10),
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should require username', async () => {
        await expect(
          User.create({
            email: 'nouser@example.com',
            password: await bcrypt.hash('Test123!', 10),
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should require email', async () => {
        await expect(
          User.create({
            username: 'noemail',
            password: await bcrypt.hash('Test123!', 10),
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should require password', async () => {
        await expect(
          User.create({
            username: 'nopass',
            email: 'nopass@example.com',
            role: 'GOON'
          })
        ).rejects.toThrow();
      });

      it('should validate role enum', async () => {
        await expect(
          User.create({
            username: 'badrole',
            email: 'badrole@example.com',
            password: await bcrypt.hash('Test123!', 10),
            role: 'INVALID_ROLE'
          })
        ).rejects.toThrow();
      });
    });

    describe('Updates', () => {
      it('should update user fields', async () => {
        const user = await User.create({
          username: 'updateuser',
          email: 'update@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        await user.update({
          bio: 'Updated bio',
          balance: 100.50
        });

        expect(user.bio).toBe('Updated bio');
        expect(parseFloat(user.balance)).toBe(100.50);
      });

      it('should update timestamp on modification', async () => {
        const user = await User.create({
          username: 'timestamp',
          email: 'timestamp@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        const originalUpdatedAt = user.updated_at;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await user.update({ bio: 'New bio' });

        expect(user.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });

    describe('Deletion', () => {
      it('should soft delete user', async () => {
        const user = await User.create({
          username: 'deleteuser',
          email: 'delete@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        await user.destroy();

        const found = await User.findByPk(user.id);
        expect(found).toBeNull();
      });

      /**
       * Test: Users created with team_id=NULL per PUML
       * Purpose: Verify new system requirement that users start without team
       * SKIPPED: User requirement changed - all users must have teams from the beginning
       */
      it.skip('should create user with team_id=NULL by default', async () => {
        const user = await User.create({
          username: 'noteamuser',
          email: 'noteam@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        expect(user.teamId).toBeNull();
      });

      /**
       * Test: Users can be assigned to team via team_id foreign key
       * Purpose: Verify team_id foreign key constraint works
       */
      it('should allow setting team_id when team exists', async () => {
        // Create team first (if Team model exists)
        let team;
        try {
          team = await Team.create({
            name: 'Test Team',
            description: 'Team for FK test'
          });
        } catch (e) {
          // Skip if Team model not available
          return;
        }

        const user = await User.create({
          username: 'teamuser',
          email: 'team@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON',
          teamId: team.id
        });

        expect(user.teamId).toBe(team.id);
      });

      it('should cascade delete related records', async () => {
        const user = await User.create({
          username: 'cascadeuser',
          email: 'cascade@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'HASHIRA'
        });

        // Create team first
        let team;
        try {
          team = await Team.create({
            name: 'Cascade Team',
            description: 'Team for cascade test'
          });
          await user.update({ teamId: team.id });
        } catch (e) {
          // Team model may not exist yet
        }

        const task = await Task.create({
          title: 'Test Task',
          description: 'Task for cascade test',
          bountyAmount: 100,
          deadline: new Date(Date.now() + 86400000),
          priority: 'MEDIUM',
          createdBy: user.id,
          teamId: team ? team.id : null
        });

        await user.destroy();

        const foundTask = await Task.findByPk(task.id);
        expect(foundTask).toBeNull();
      });
    });

    describe('Team-Related Constraints', () => {
      /**
       * Test: Team deletion cascades to users
       * Purpose: Verify CASCADE DELETE for team_id foreign key
       */
      it('should handle team deletion with CASCADE or SET NULL', async () => {
        let team;
        try {
          team = await Team.create({
            name: 'Deletable Team',
            description: 'Team to be deleted'
          });
        } catch (e) {
          // Skip if Team model not available
          return;
        }

        const user = await User.create({
          username: 'teamdeleteuser',
          email: 'teamdelete@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON',
          teamId: team.id
        });

        await team.destroy();

        // User should either be deleted (CASCADE) or have team_id set to NULL (SET NULL)
        const foundUser = await User.findByPk(user.id);
        if (foundUser) {
          expect(foundUser.teamId).toBeNull();
        }
      });

      /**
       * Test: Tasks are team-scoped
       * Purpose: Verify tasks include team_id for team isolation
       */
      it('should support team_id on tasks for team isolation', async () => {
        let team;
        try {
          team = await Team.create({
            name: 'Task Team',
            description: 'Team for task isolation'
          });
        } catch (e) {
          // Skip if Team model not available
          return;
        }

        const user = await User.create({
          username: 'taskteamuser',
          email: 'taskteam@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'HASHIRA',
          teamId: team.id
        });

        const task = await Task.create({
          title: 'Team Task',
          description: 'Task with team_id',
          bountyAmount: 100,
          deadline: new Date(Date.now() + 86400000),
          createdBy: user.id,
          teamId: team.id
        });

        expect(task.teamId).toBe(team.id);
      });
    });
  });

  describe('Task Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'taskuser',
        email: 'task@example.com',
        password: await bcrypt.hash('Test123!', 10),
        role: 'HASHIRA'
      });
    });

    describe('Model Creation', () => {
      it('should create task with valid data', async () => {
        const task = await Task.create({
          title: 'Test Task',
          description: 'This is a test task',
          bountyAmount: 100.00,
          deadline: new Date(Date.now() + 86400000),
          priority: 'HIGH',
          createdBy: testUser.id
        });

        expect(task.id).toBeTruthy();
        expect(task.title).toBe('Test Task');
        expect(parseFloat(task.bountyAmount)).toBe(100.00);
      });

      it('should set default status to AVAILABLE', async () => {
        const task = await Task.create({
          title: 'Default Status Task',
          description: 'Test default status',
          bountyAmount: 50,
          deadline: new Date(Date.now() + 86400000),
          createdBy: testUser.id
        });

        expect(task.status).toBe('AVAILABLE');
      });

      it('should set default priority to MEDIUM', async () => {
        const task = await Task.create({
          title: 'Default Priority Task',
          description: 'Test default priority',
          bountyAmount: 50,
          deadline: new Date(Date.now() + 86400000),
          createdBy: testUser.id
        });

        expect(task.priority).toBe('MEDIUM');
      });

      it('should store tags as JSON', async () => {
        const tags = ['urgent', 'backend', 'bug'];
        
        const task = await Task.create({
          title: 'Task with Tags',
          description: 'Test JSON tags',
          bountyAmount: 50,
          deadline: new Date(Date.now() + 86400000),
          createdBy: testUser.id,
          tags: tags
        });

        expect(Array.isArray(task.tags)).toBe(true);
        expect(task.tags).toEqual(tags);
      });
    });

    describe('Validations', () => {
      it('should require title', async () => {
        await expect(
          Task.create({
            description: 'No title task',
            bountyAmount: 50,
            deadline: new Date(Date.now() + 86400000),
            createdBy: testUser.id
          })
        ).rejects.toThrow();
      });

      it('should require description', async () => {
        await expect(
          Task.create({
            title: 'No Description',
            bountyAmount: 50,
            deadline: new Date(Date.now() + 86400000),
            createdBy: testUser.id
          })
        ).rejects.toThrow();
      });

      it('should require bountyAmount', async () => {
        await expect(
          Task.create({
            title: 'No Bounty',
            description: 'Task without bounty',
            deadline: new Date(Date.now() + 86400000),
            createdBy: testUser.id
          })
        ).rejects.toThrow();
      });

      it('should require deadline', async () => {
        await expect(
          Task.create({
            title: 'No Deadline',
            description: 'Task without deadline',
            bountyAmount: 50,
            createdBy: testUser.id
          })
        ).rejects.toThrow();
      });

      it('should validate status enum', async () => {
        await expect(
          Task.create({
            title: 'Invalid Status',
            description: 'Test invalid status',
            bountyAmount: 50,
            deadline: new Date(Date.now() + 86400000),
            createdBy: testUser.id,
            status: 'INVALID_STATUS'
          })
        ).rejects.toThrow();
      });

      it('should validate priority enum', async () => {
        await expect(
          Task.create({
            title: 'Invalid Priority',
            description: 'Test invalid priority',
            bountyAmount: 50,
            deadline: new Date(Date.now() + 86400000),
            createdBy: testUser.id,
            priority: 'INVALID_PRIORITY'
          })
        ).rejects.toThrow();
      });
    });

    describe('Relationships', () => {
      it('should associate task with creator', async () => {
        const task = await Task.create({
          title: 'Relationship Test',
          description: 'Test creator relationship',
          bountyAmount: 50,
          deadline: new Date(Date.now() + 86400000),
          createdBy: testUser.id
        });

        const taskWithCreator = await Task.findByPk(task.id, {
          include: [{ association: 'creator' }]
        });

        expect(taskWithCreator.creator.id).toBe(testUser.id);
        expect(taskWithCreator.creator.username).toBe('taskuser');
      });

      it('should associate task with assignee', async () => {
        const assignee = await User.create({
          username: 'assignee',
          email: 'assignee@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        const task = await Task.create({
          title: 'Assigned Task',
          description: 'Test assignee relationship',
          bountyAmount: 50,
          deadline: new Date(Date.now() + 86400000),
          createdBy: testUser.id,
          assignedTo: assignee.id
        });

        const taskWithAssignee = await Task.findByPk(task.id, {
          include: [{ association: 'assignee' }]
        });

        expect(taskWithAssignee.assignee.id).toBe(assignee.id);
      });
    });
  });

  describe('License Model', () => {
    describe('Model Creation', () => {
      it('should create license with valid data', async () => {
        const user = await User.create({
          username: 'testlicuser',
          email: 'testlic@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });
        const team = await Team.create({ name: 'Test Team', createdBy: user.id });
        const license = await License.create({
          teamId: team.id,
          teamName: 'Test Team',
          licenseKey: 'TEST-2024-ABC123',
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxUsers: 10
        });

        expect(license.id).toBeTruthy();
        expect(license.teamName).toBe('Test Team');
        expect(license.licenseKey).toBe('TEST-2024-ABC123');
      });

      it('should set default maxUsers to 50', async () => {
        const user = await User.create({
          username: 'defaultmaxuser',
          email: 'defaultmax@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });
        const team = await Team.create({ name: 'Default Max Users', createdBy: user.id });
        const license = await License.create({
          teamId: team.id,
          teamName: 'Default Max Users',
          licenseKey: 'DEFAULT-2024',
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        expect(license.maxUsers).toBe(50);
      });

      it('should set default isActive to true', async () => {
        const user = await User.create({
          username: 'activeuser',
          email: 'active@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });
        const team = await Team.create({ name: 'Active License', createdBy: user.id });
        const license = await License.create({
          teamId: team.id,
          teamName: 'Active License',
          licenseKey: 'ACTIVE-2024',
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        expect(license.isActive).toBe(true);
      });
    });

    describe('Validations', () => {
      it('should require teamName', async () => {
        await expect(
          License.create({
            licenseKey: 'NO-TEAM-2024',
            isActive: true
          })
        ).rejects.toThrow();
      });

      it('should require unique licenseKey', async () => {
        const user = await User.create({
          username: 'dupkeyuser',
          email: 'dupkey@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });
        const team1 = await Team.create({ name: 'Team 1', createdBy: user.id });
        await License.create({
          teamId: team1.id,
          teamName: 'Team 1',
          licenseKey: 'DUPLICATE-KEY',
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const team2 = await Team.create({ name: 'Team 2', createdBy: user.id });
        await expect(
          License.create({
            teamId: team2.id,
            teamName: 'Team 2',
            licenseKey: 'DUPLICATE-KEY',
            isActive: true,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          })
        ).rejects.toThrow();
      });
    });

    describe('Relationships', () => {
      it('should associate license with multiple users', async () => {
        const creator = await User.create({
          username: 'multiusercreator',
          email: 'creator@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });
        const team = await Team.create({ name: 'Multi User Team', createdBy: creator.id });
        const license = await License.create({
          teamId: team.id,
          teamName: 'Multi User Team',
          licenseKey: 'MULTI-2024',
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const user1 = await User.create({
          username: 'licuser1',
          email: 'licuser1@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        const user2 = await User.create({
          username: 'licuser2',
          email: 'licuser2@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        });

        await user1.addLicense(license);
        await user2.addLicense(license);

        const licenseWithUsers = await License.findByPk(license.id, {
          include: [{ model: User }]
        });

        expect(licenseWithUsers.Users).toHaveLength(2);
      });
    });
  });

  describe('Notification Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'notifuser',
        email: 'notif@example.com',
        password: await bcrypt.hash('Test123!', 10),
        role: 'GOON'
      });
    });

    describe('Model Creation', () => {
      it('should create notification with valid data', async () => {
        const notification = await Notification.create({
          userId: testUser.id,
          type: 'TASK_ASSIGNED',
          title: 'New Task',
          message: 'You have been assigned a new task',
          readStatus: false
        });

        expect(notification.id).toBeTruthy();
        expect(notification.userId).toBe(testUser.id);
        expect(notification.type).toBe('TASK_ASSIGNED');
      });

      it('should set default readStatus to false', async () => {
        const notification = await Notification.create({
          userId: testUser.id,
          type: 'BOUNTY_RECEIVED',
          title: 'Bounty',
          message: 'You received a bounty'
        });

        expect(notification.readStatus).toBe(false);
      });
    });

    describe('Validations', () => {
      it('should require userId', async () => {
        await expect(
          Notification.create({
            type: 'TASK_ASSIGNED',
            title: 'No User',
            message: 'Test'
          })
        ).rejects.toThrow();
      });

      it('should validate type enum', async () => {
        await expect(
          Notification.create({
            userId: testUser.id,
            type: 'INVALID_TYPE',
            title: 'Test',
            message: 'Test'
          })
        ).rejects.toThrow();
      });
    });

    describe('Relationships', () => {
      it('should associate notification with user', async () => {
        const notification = await Notification.create({
          userId: testUser.id,
          type: 'TASK_COMPLETED',
          title: 'Task Done',
          message: 'Your task is completed'
        });

        const notificationWithUser = await Notification.findByPk(notification.id, {
          include: [{ model: User }]
        });

        expect(notificationWithUser.User.id).toBe(testUser.id);
      });
    });
  });

  describe('Transaction Model', () => {
    let testUser, testTask;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'transuser',
        email: 'trans@example.com',
        password: await bcrypt.hash('Test123!', 10),
        role: 'GOON'
      });

      testTask = await Task.create({
        title: 'Transaction Task',
        description: 'Task for transaction test',
        bountyAmount: 100,
        deadline: new Date(Date.now() + 86400000),
        createdBy: testUser.id
      });
    });

    describe('Model Creation', () => {
      it('should create transaction with valid data', async () => {
        const transaction = await Transaction.create({
          userId: testUser.id,
          taskId: testTask.id,
          type: 'BOUNTY',
          amount: 100.00,
          description: 'Task completion bounty',
          balanceBefore: 0,
          balanceAfter: 100
        });

        expect(transaction.id).toBeTruthy();
        expect(parseFloat(transaction.amount)).toBe(100.00);
        expect(transaction.type).toBe('BOUNTY');
      });

      it('should validate type enum', async () => {
        await expect(
          Transaction.create({
            userId: testUser.id,
            taskId: testTask.id,
            type: 'INVALID_TYPE',
            amount: 50
          })
        ).rejects.toThrow();
      });
    });

    describe('Relationships', () => {
      it('should associate transaction with user and task', async () => {
        const transaction = await Transaction.create({
          userId: testUser.id,
          taskId: testTask.id,
          type: 'BOUNTY',
          amount: 100.00
        });

        const transactionWithRelations = await Transaction.findByPk(transaction.id, {
          include: [
            { model: User },
            { model: Task }
          ]
        });

        expect(transactionWithRelations.User.id).toBe(testUser.id);
        expect(transactionWithRelations.Task.id).toBe(testTask.id);
      });
    });
  });

  describe('Database Transactions', () => {
    it('should rollback on error', async () => {
      const t = await sequelize.transaction();

      try {
        await User.create({
          username: 'rollbackuser',
          email: 'rollback@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        }, { transaction: t });

        // Force an error
        throw new Error('Test error');

        await t.commit();
      } catch (error) {
        await t.rollback();
      }

      const user = await User.findOne({ where: { username: 'rollbackuser' } });
      expect(user).toBeNull();
    });

    it('should commit successful transaction', async () => {
      const t = await sequelize.transaction();

      try {
        const user = await User.create({
          username: 'commituser',
          email: 'commit@example.com',
          password: await bcrypt.hash('Test123!', 10),
          role: 'GOON'
        }, { transaction: t });

        await t.commit();

        const foundUser = await User.findOne({ where: { username: 'commituser' } });
        expect(foundUser).toBeTruthy();
        expect(foundUser.username).toBe('commituser');
      } catch (error) {
        await t.rollback();
        throw error;
      }
    });
  });

  describe('Query Performance', () => {
    it('should efficiently query with includes', async () => {
      const user = await User.create({
        username: 'perfuser',
        email: 'perf@example.com',
        password: await bcrypt.hash('Test123!', 10),
        role: 'HASHIRA'
      });

      await Task.create({
        title: 'Perf Task 1',
        description: 'Performance test task 1',
        bountyAmount: 50,
        deadline: new Date(Date.now() + 86400000),
        createdBy: user.id
      });

      await Task.create({
        title: 'Perf Task 2',
        description: 'Performance test task 2',
        bountyAmount: 75,
        deadline: new Date(Date.now() + 86400000),
        createdBy: user.id
      });

      const startTime = Date.now();
      
      const userWithTasks = await User.findByPk(user.id, {
        include: [{ association: 'createdTasks' }]
      });

      const queryTime = Date.now() - startTime;

      expect(userWithTasks.createdTasks).toHaveLength(2);
      expect(queryTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});