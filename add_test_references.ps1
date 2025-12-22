# PowerShell Script to Add Test Case References to Test Files
# This script adds documentation references as comments in test files

Write-Host "Adding test case references to test files..." -ForegroundColor Green

# Function to add reference comment before a test
function Add-TestReference {
    param (
        [string]$FilePath,
        [string]$TestName,
        [string]$TestCaseId,
        [string]$Section,
        [string]$Objective,
        [string]$Priority,
        [string]$Category
    )
    
    $content = Get-Content $FilePath -Raw
    
    $referenceComment = @"
    /**
     * Test Case: $TestCaseId
     * Reference: TESTING_DOCUMENTATION Section $Section
     * Objective: $Objective
     * Priority: $Priority | Category: $Category
     */
"@
    
    # Find the test and add reference if not already present
    if ($content -notmatch "Test Case: $TestCaseId") {
        $pattern = "(\s+)(it\('$TestName')"
        $replacement = "`$1$referenceComment`r`n`$1`$2"
        $newContent = $content -replace $pattern, $replacement
        
        if ($newContent -ne $content) {
            Set-Content -Path $FilePath -Value $newContent -NoNewline
            Write-Host "  ✓ Added $TestCaseId to $FilePath" -ForegroundColor Cyan
            return $true
        }
    }
    return $false
}

# Auth Tests
Write-Host "`nProcessing auth.test.js..." -ForegroundColor Yellow
$authTests = @(
    @{
        TestName = "should register a new user with team_id=NULL"
        TestCaseId = "TC-AUTH-001"
        Section = "4.1"
        Objective = "Verify new users register with team_id=NULL"
        Priority = "High"
        Category = "Functional Testing"
    },
    @{
        TestName = "should login user without team and return no_team flag"
        TestCaseId = "TC-AUTH-002"
        Section = "4.1"
        Objective = "Verify login returns JWT token and no_team flag"
        Priority = "High"
        Category = "Functional Testing"
    },
    @{
        TestName = "should enforce role-based access control"
        TestCaseId = "TC-AUTH-003"
        Section = "4.1"
        Objective = "Verify role-based permissions are enforced"
        Priority = "High"
        Category = "Security Testing"
    }
)

foreach ($test in $authTests) {
    Add-TestReference -FilePath "backend\__tests__\auth.test.js" @test
}

# Task Tests
Write-Host "`nProcessing tasks.test.js..." -ForegroundColor Yellow
$taskTests = @(
    @{
        TestName = "should allow Hashira to create task"
        TestCaseId = "TC-TASK-001"
        Section = "4.2"
        Objective = "Verify HASHIRA role can create tasks"
        Priority = "High"
        Category = "Functional + Authorization"
    },
    @{
        TestName = "should not allow Goon to create task"
        TestCaseId = "TC-TASK-002"
        Section = "4.2"
        Objective = "Verify GOON role cannot create tasks"
        Priority = "High"
        Category = "Authorization Testing"
    },
    @{
        TestName = "should update task status"
        TestCaseId = "TC-TASK-003"
        Section = "4.2"
        Objective = "Verify task status updates through workflow"
        Priority = "High"
        Category = "Functional Testing"
    },
    @{
        TestName = "should allow creator to delete available task"
        TestCaseId = "TC-TASK-004"
        Section = "4.2"
        Objective = "Verify task creators can delete AVAILABLE tasks"
        Priority = "High"
        Category = "Functional + Authorization"
    },
    @{
        TestName = "should not allow deleting assigned task"
        TestCaseId = "TC-TASK-005"
        Section = "4.2"
        Objective = "Verify assigned tasks cannot be deleted"
        Priority = "High"
        Category = "Business Rule Testing"
    }
)

foreach ($test in $taskTests) {
    Add-TestReference -FilePath "backend\__tests__\tasks.test.js" @test
}

# License Tests
Write-Host "`nProcessing license.test.js..." -ForegroundColor Yellow
$licenseTests = @(
    @{
        TestName = "should reject expired license key"
        TestCaseId = "TC-LICENSE-001"
        Section = "4.3"
        Objective = "Verify expired license keys are rejected"
        Priority = "High"
        Category = "Security Testing"
    },
    @{
        TestName = "should reject invalid license key"
        TestCaseId = "TC-LICENSE-002"
        Section = "4.3"
        Objective = "Verify invalid license keys are rejected"
        Priority = "High"
        Category = "Security Testing"
    }
)

foreach ($test in $licenseTests) {
    Add-TestReference -FilePath "backend\__tests__\license.test.js" @test
}

# Bounty Tests
Write-Host "`nProcessing bounty.test.js..." -ForegroundColor Yellow
$bountyTests = @(
    @{
        TestName = "GET /api/v1/bounties/statistics returns correct aggregated values"
        TestCaseId = "TC-BOUNTY-001"
        Section = "4.4"
        Objective = "Verify bounty statistics aggregation"
        Priority = "High"
        Category = "Functional + Data Aggregation"
    },
    @{
        TestName = "GET /api/v1/bounties/transactions/:userId"
        TestCaseId = "TC-BOUNTY-002"
        Section = "4.4"
        Objective = "Verify transaction history retrieval"
        Priority = "High"
        Category = "Functional Testing"
    }
)

foreach ($test in $bountyTests) {
    Add-TestReference -FilePath "backend\__tests__\bounty.test.js" @test
}

# Team Tests
Write-Host "`nProcessing team.test.js..." -ForegroundColor Yellow
$teamTests = @(
    @{
        TestName = "should create a team with valid license key"
        TestCaseId = "TC-TEAM-001"
        Section = "4.5"
        Objective = "Verify team creation with valid license"
        Priority = "High"
        Category = "Integration Testing"
    }
)

foreach ($test in $teamTests) {
    Add-TestReference -FilePath "backend\__tests__\team.test.js" @test
}

# User Tests
Write-Host "`nProcessing user.test.js..." -ForegroundColor Yellow
$userTests = @(
    @{
        TestName = "should allow users to view team member profiles"
        TestCaseId = "TC-USER-001"
        Section = "4.6"
        Objective = "Verify team isolation for user profiles"
        Priority = "High"
        Category = "Security + Authorization"
    }
)

foreach ($test in $userTests) {
    Add-TestReference -FilePath "backend\__tests__\user.test.js" @test
}

# Notification Tests
Write-Host "`nProcessing notifications.test.js..." -ForegroundColor Yellow
$notifTests = @(
    @{
        TestName = "should create notification on task assignment"
        TestCaseId = "TC-NOTIF-001"
        Section = "4.7"
        Objective = "Verify notifications on task assignment"
        Priority = "Medium"
        Category = "Functional + Event-Driven"
    },
    @{
        TestName = "should mark notification as read"
        TestCaseId = "TC-NOTIF-002"
        Section = "4.7"
        Objective = "Verify mark as read functionality"
        Priority = "Low"
        Category = "Functional Testing"
    }
)

foreach ($test in $notifTests) {
    Add-TestReference -FilePath "backend\__tests__\notifications.test.js" @test
}

Write-Host "`n✓ Test case references added successfully!" -ForegroundColor Green
Write-Host "Note: Manual review may be needed for tests with similar names." -ForegroundColor Yellow
