const { User, License, Task, Team } = require('../models');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

const seed = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    logger.info('Starting database seeding...');

    // Temporarily disable foreign key checks to handle circular dependency
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    // Step 1: Create temporary admin user with teamId=1 (doesn't exist yet)
    const admin = await User.create({
      username: 'oyakatasama',
      email: 'admin@dscpms.com',
      password: 'Admin123!',
      role: 'OYAKATASAMA',
      balance: 10000.00,
      bio: 'System Administrator - The leader of the Demon Slayer Corps',
      teamId: 1  // Will be created next
    }, { transaction });
    logger.info(`Created admin user: ${admin.username}`);

    // Step 2: Create default team with admin as creator
    const defaultTeam = await Team.create({
      id: 1,
      name: 'Demon Slayer Corps HQ',
      description: 'Main headquarters team',
      isActive: true,
      createdBy: admin.id
    }, { transaction });
    logger.info(`Created default team: ${defaultTeam.name}`);

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

    // Create Hashira users
    const hashira1 = await User.create({
      username: 'rengoku',
      email: 'rengoku@dscpms.com',
      password: 'Hashira123!',
      role: 'HASHIRA',
      balance: 5000.00,
      bio: 'Flame Hashira - Senior Developer specializing in backend systems',
      teamId: defaultTeam.id
    }, { transaction });

    const hashira2 = await User.create({
      username: 'shinobu',
      email: 'shinobu@dscpms.com',
      password: 'Hashira123!',
      role: 'HASHIRA',
      balance: 5000.00,
      bio: 'Insect Hashira - Senior Developer specializing in frontend development',
      teamId: defaultTeam.id
    }, { transaction });
    logger.info('Created Hashira users');

    // Create Goon users
    const goon1 = await User.create({
      username: 'tanjiro',
      email: 'tanjiro@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 1000.00,
      bio: 'Junior Developer - Eager to learn and take on challenges',
      teamId: defaultTeam.id
    }, { transaction });

    const goon2 = await User.create({
      username: 'zenitsu',
      email: 'zenitsu@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 800.00,
      bio: 'Junior Developer - Specialized in lightning-fast implementations',
      teamId: defaultTeam.id
    }, { transaction });

    const goon3 = await User.create({
      username: 'inosuke',
      email: 'inosuke@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 900.00,
      bio: 'Junior Developer - Loves tackling tough problems head-on',
      teamId: defaultTeam.id
    }, { transaction });
    logger.info('Created Goon users');

    // Create licenses from environment variables
    let licenses = [];
    try {
      // Parse licenses from environment variable
      const licensesEnv = process.env.LICENSES;
      if (licensesEnv) {
        const licensesConfig = JSON.parse(licensesEnv);
        
        // Create each license from the config
        for (const licenseConfig of licensesConfig) {
          const license = await License.create({
            teamId: defaultTeam.id,
            teamName: licenseConfig.team_name || `Team - ${licenseConfig.key}`,
            licenseKey: licenseConfig.key,
            isActive: true,
            expirationDate: new Date(licenseConfig.expiry_date),
            maxUsers: licenseConfig.max_users,
            notes: licenseConfig.notes || 'License created from environment configuration'
          }, { transaction });
          licenses.push(license);
          logger.info(`Created license: ${license.licenseKey}`);
        }
      } else {
        // Fallback: Create a default license if no env variable is set
        logger.warn('No LICENSES environment variable found, creating default license');
        const defaultLicense = await License.create({
          teamId: defaultTeam.id,
          teamName: 'Demon Slayer Corps HQ',
          licenseKey: 'DSCPMS-2024-UNLIMITED-ACCESS',
          isActive: true,
          expirationDate: new Date('2025-12-31'),
          maxUsers: 100,
          notes: 'Default team license with full access'
        }, { transaction });
        licenses.push(defaultLicense);
        logger.info('Created default license');
      }
    } catch (error) {
      logger.error('Error parsing LICENSES from environment:', error);
      // Fallback: Create a default license on error
      const defaultLicense = await License.create({
        teamId: defaultTeam.id,
        teamName: 'Demon Slayer Corps HQ',
        licenseKey: 'DSCPMS-2024-UNLIMITED-ACCESS',
        isActive: true,
        expirationDate: new Date('2025-12-31'),
        maxUsers: 100,
        notes: 'Default team license with full access'
      }, { transaction });
      licenses.push(defaultLicense);
      logger.info('Created default license due to parsing error');
    }

    // Assign first license to all users
    const primaryLicense = licenses[0];
    await admin.addLicense(primaryLicense, { transaction });
    await hashira1.addLicense(primaryLicense, { transaction });
    await hashira2.addLicense(primaryLicense, { transaction });
    await goon1.addLicense(primaryLicense, { transaction });
    await goon2.addLicense(primaryLicense, { transaction });
    await goon3.addLicense(primaryLicense, { transaction });
    logger.info('Assigned primary license to users');

    // Create sample tasks
    const task1 = await Task.create({
      title: 'Implement User Authentication API',
      description: 'Create RESTful endpoints for user registration, login, and JWT token management. Include password hashing with bcrypt and token validation middleware.',
      status: 'AVAILABLE',
      priority: 'HIGH',
      bountyAmount: 500.00,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      tags: ['backend', 'authentication', 'security'],
      createdBy: hashira1.id
    }, { transaction });

    const task2 = await Task.create({
      title: 'Design Responsive Dashboard UI',
      description: 'Create a modern, responsive dashboard interface using React and TailwindCSS. Should include navigation, sidebar, and main content area.',
      status: 'AVAILABLE',
      priority: 'HIGH',
      bountyAmount: 450.00,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'react', 'ui/ux'],
      createdBy: hashira2.id
    }, { transaction });

    const task3 = await Task.create({
      title: 'Setup Database Schema',
      description: 'Design and implement MySQL database schema with proper relationships, indexes, and constraints for the DSCPMS system.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      bountyAmount: 400.00,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags: ['database', 'mysql', 'backend'],
      createdBy: hashira1.id,
      assignedTo: goon1.id,
      assignedAt: new Date()
    }, { transaction });

    const task4 = await Task.create({
      title: 'Create Kanban Board Component',
      description: 'Implement drag-and-drop Kanban board for task management with columns for Available, In Progress, Review, and Completed.',
      status: 'AVAILABLE',
      priority: 'MEDIUM',
      bountyAmount: 350.00,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'react', 'drag-drop'],
      createdBy: hashira2.id
    }, { transaction });

    const task5 = await Task.create({
      title: 'Implement Notification System',
      description: 'Build real-time notification system for task assignments, completions, and deadline reminders.',
      status: 'AVAILABLE',
      priority: 'MEDIUM',
      bountyAmount: 300.00,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: ['backend', 'notifications', 'real-time'],
      createdBy: hashira1.id
    }, { transaction });

    logger.info('Created sample tasks');
    
    await transaction.commit();

    logger.info('Database seeding completed successfully!');
    logger.info('\n=== TEAM INFORMATION ===');
    logger.info(`Team: ${defaultTeam.name} (ID: ${defaultTeam.id})`);
    logger.info(`Created By: ${admin.username}`);
    logger.info(`Members: 6 users`);
    logger.info(`License: ${primaryLicense.licenseKey}`);
    logger.info(`License Expires: ${primaryLicense.expirationDate.toLocaleDateString()}`);
    logger.info(`Max Users: ${primaryLicense.maxUsers}`);
    
    logger.info('\n=== LOGIN CREDENTIALS ===');
    logger.info(`Admin: oyakatasama / Admin123! (Balance: $${admin.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    logger.info(`Hashira: rengoku / Hashira123! (Balance: $${hashira1.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    logger.info(`Hashira: shinobu / Hashira123! (Balance: $${hashira2.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    logger.info(`Goon: tanjiro / Goon123! (Balance: $${goon1.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    logger.info(`Goon: zenitsu / Goon123! (Balance: $${goon2.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    logger.info(`Goon: inosuke / Goon123! (Balance: $${goon3.balance.toFixed(2)}, Team: ${defaultTeam.name})`);
    
    logger.info('\n=== TASKS CREATED ===');
    logger.info(`Task 1: "${task1.title}" - $${task1.bountyAmount} (${task1.status})`);
    logger.info(`Task 2: "${task2.title}" - $${task2.bountyAmount} (${task2.status})`);
    logger.info(`Task 3: "${task3.title}" - $${task3.bountyAmount} (${task3.status} - Assigned to ${goon1.username})`);
    logger.info(`Task 4: "${task4.title}" - $${task4.bountyAmount} (${task4.status})`);
    logger.info(`Task 5: "${task5.title}" - $${task5.bountyAmount} (${task5.status})`);
    
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
