const { User, License, Task } = require('../models');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    logger.info('Starting database seeding...');

    // Create admin user (Oyakatasama)
    const admin = await User.create({
      username: 'oyakatasama',
      email: 'admin@dscpms.com',
      password: 'Admin123!',
      role: 'OYAKATASAMA',
      balance: 10000.00,
      bio: 'System Administrator - The leader of the Demon Slayer Corps'
    });
    logger.info(`Created admin user: ${admin.username}`);

    // Create Hashira users
    const hashira1 = await User.create({
      username: 'rengoku',
      email: 'rengoku@dscpms.com',
      password: 'Hashira123!',
      role: 'HASHIRA',
      balance: 5000.00,
      bio: 'Flame Hashira - Senior Developer specializing in backend systems'
    });

    const hashira2 = await User.create({
      username: 'shinobu',
      email: 'shinobu@dscpms.com',
      password: 'Hashira123!',
      role: 'HASHIRA',
      balance: 5000.00,
      bio: 'Insect Hashira - Senior Developer specializing in frontend development'
    });
    logger.info('Created Hashira users');

    // Create Goon users
    const goon1 = await User.create({
      username: 'tanjiro',
      email: 'tanjiro@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 1000.00,
      bio: 'Junior Developer - Eager to learn and take on challenges'
    });

    const goon2 = await User.create({
      username: 'zenitsu',
      email: 'zenitsu@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 800.00,
      bio: 'Junior Developer - Specialized in lightning-fast implementations'
    });

    const goon3 = await User.create({
      username: 'inosuke',
      email: 'inosuke@dscpms.com',
      password: 'Goon123!',
      role: 'GOON',
      balance: 900.00,
      bio: 'Junior Developer - Loves tackling tough problems head-on'
    });
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
            teamName: licenseConfig.team_name || `Team - ${licenseConfig.key}`,
            licenseKey: licenseConfig.key,
            isActive: true,
            expirationDate: new Date(licenseConfig.expiry_date),
            maxUsers: licenseConfig.max_users,
            notes: licenseConfig.notes || 'License created from environment configuration'
          });
          licenses.push(license);
          logger.info(`Created license: ${license.licenseKey}`);
        }
      } else {
        // Fallback: Create a default license if no env variable is set
        logger.warn('No LICENSES environment variable found, creating default license');
        const defaultLicense = await License.create({
          teamName: 'Demon Slayer Corps HQ',
          licenseKey: 'DSCPMS-2024-UNLIMITED-ACCESS',
          isActive: true,
          expirationDate: new Date('2025-12-31'),
          maxUsers: 100,
          notes: 'Default team license with full access'
        });
        licenses.push(defaultLicense);
        logger.info('Created default license');
      }
    } catch (error) {
      logger.error('Error parsing LICENSES from environment:', error);
      // Fallback: Create a default license on error
      const defaultLicense = await License.create({
        teamName: 'Demon Slayer Corps HQ',
        licenseKey: 'DSCPMS-2024-UNLIMITED-ACCESS',
        isActive: true,
        expirationDate: new Date('2025-12-31'),
        maxUsers: 100,
        notes: 'Default team license with full access'
      });
      licenses.push(defaultLicense);
      logger.info('Created default license due to parsing error');
    }

    // Assign first license to all users
    const primaryLicense = licenses[0];
    await admin.addLicense(primaryLicense);
    await hashira1.addLicense(primaryLicense);
    await hashira2.addLicense(primaryLicense);
    await goon1.addLicense(primaryLicense);
    await goon2.addLicense(primaryLicense);
    await goon3.addLicense(primaryLicense);
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
    });

    const task2 = await Task.create({
      title: 'Design Responsive Dashboard UI',
      description: 'Create a modern, responsive dashboard interface using React and TailwindCSS. Should include navigation, sidebar, and main content area.',
      status: 'AVAILABLE',
      priority: 'HIGH',
      bountyAmount: 450.00,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'react', 'ui/ux'],
      createdBy: hashira2.id
    });

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
    });

    const task4 = await Task.create({
      title: 'Create Kanban Board Component',
      description: 'Implement drag-and-drop Kanban board for task management with columns for Available, In Progress, Review, and Completed.',
      status: 'AVAILABLE',
      priority: 'MEDIUM',
      bountyAmount: 350.00,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'react', 'drag-drop'],
      createdBy: hashira2.id
    });

    const task5 = await Task.create({
      title: 'Implement Notification System',
      description: 'Build real-time notification system for task assignments, completions, and deadline reminders.',
      status: 'AVAILABLE',
      priority: 'MEDIUM',
      bountyAmount: 300.00,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: ['backend', 'notifications', 'real-time'],
      createdBy: hashira1.id
    });

    logger.info('Created sample tasks');

    logger.info('Database seeding completed successfully!');
    logger.info('\n=== Login Credentials ===');
    logger.info('Admin: oyakatasama / Admin123!');
    logger.info('Hashira: rengoku / Hashira123!');
    logger.info('Hashira: shinobu / Hashira123!');
    logger.info('Goon: tanjiro / Goon123!');
    logger.info('Goon: zenitsu / Goon123!');
    logger.info('Goon: inosuke / Goon123!');
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
