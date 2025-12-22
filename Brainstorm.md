This is a project for CSCI3100:

In a realm where warriors fought valiantly against the forces of darkness, the boss of
the organization struggled with managing their software projects, leading to chaotic
battles and the tragic loss of many brave warriors. Recognizing the dire need for better
organization, Kei, the CSCI3100 lecturer, and his eager students decided to step in, determined
to create a robust software project management tool tailored specifically for the organization.
With their combined skills in coding and project management, they envisioned a system that
would streamline communication, track progress, and allocate resources effectively, ultimately
empowering the slayers to focus on their true mission: vanquishing demons and protecting
humanity…

Thus we would like to make a Bounty based project management system. Basically a kanban board but with a task selection page, consisting task cards which includes its bounty price, task name, content, PIC.

There will be 3 levels of credential:
- Goons (Junior Programmer)
    - Can select task cards and join that task
    - reward penalty for missed deadlines/unfavourable task completion
    - can view own profile and see their own money, and ongoing tasks
    - Can change the status of the task
- Hashira (Senior Programmers)
    - Access to Goons' functions
    - can create task bounty
    - can view their tasks progression
    - notified when a goon/other senior participate on the task
- Oyakatasama (Admin) (TBD)
    - Own the license of the project
    - Manage Goons/Hashira account (create, edit, delete)

Mandatory Functional Requirements:
License system for the software to join the demon slaying corp
Secure Login System
database for storing user credentials, bounty details etc, add when needed

planned architecture:
- webapp: react@vite
- HeroUI 
- database: MySQL
- docker for development
