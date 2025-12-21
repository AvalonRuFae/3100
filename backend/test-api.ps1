# DSCPMS Backend API Test Script
Write-Host "=== DSCPMS API Tests ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Health Check Passed" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "✗ Health Check Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Login
Write-Host "Test 2: Login as Goon (tanjiro)" -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "tanjiro"
        password = "Goon123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $goonToken = $loginResponse.data.token
    Write-Host "✓ Login Successful" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.username), Role: $($loginResponse.data.user.role)"
} catch {
    Write-Host "✗ Login Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Current User
Write-Host "Test 3: Get Current User" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Write-Host "✓ Get Current User Passed" -ForegroundColor Green
    Write-Host "Username: $($meResponse.data.username), Balance: $($meResponse.data.balance)"
} catch {
    Write-Host "✗ Get Current User Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get All Tasks
Write-Host "Test 4: Get All Tasks" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $tasksResponse = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Get -Headers $headers
    Write-Host "✓ Get All Tasks Passed" -ForegroundColor Green
    Write-Host "Total Tasks: $($tasksResponse.data.Count)"
} catch {
    Write-Host "✗ Get All Tasks Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Kanban Board
Write-Host "Test 5: Get Kanban Board" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $boardResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/board" -Method Get -Headers $headers
    Write-Host "✓ Get Kanban Board Passed" -ForegroundColor Green
    Write-Host "Available: $($boardResponse.data.available.Count)"
    Write-Host "In Progress: $($boardResponse.data.inProgress.Count)"
    Write-Host "Review: $($boardResponse.data.review.Count)"
    Write-Host "Completed: $($boardResponse.data.completed.Count)"
} catch {
    Write-Host "✗ Get Kanban Board Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Login as Hashira
Write-Host "Test 6: Login as Hashira (rengoku)" -ForegroundColor Yellow
try {
    $hashiraLoginBody = @{
        username = "rengoku"
        password = "Hashira123!"
    } | ConvertTo-Json

    $hashiraLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $hashiraLoginBody -ContentType "application/json"
    $hashiraToken = $hashiraLoginResponse.data.token
    Write-Host "✓ Hashira Login Successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Hashira Login Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Create Task (Hashira only)
Write-Host "Test 7: Create Task as Hashira" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $hashiraToken" }
    $taskBody = @{
        title = "Test API Task"
        description = "This task was created via the API test script"
        bountyAmount = 250.00
        deadline = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
        priority = "MEDIUM"
        tags = @("api", "test")
    } | ConvertTo-Json

    $createTaskResponse = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers -ContentType "application/json"
    $newTaskId = $createTaskResponse.data.id
    Write-Host "✓ Task Created Successfully" -ForegroundColor Green
    Write-Host "Task ID: $newTaskId, Title: $($createTaskResponse.data.title)"
} catch {
    Write-Host "✗ Create Task Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Assign Task to Goon
Write-Host "Test 8: Assign Task to Goon" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $assignResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$newTaskId/assign" -Method Post -Headers $headers
    Write-Host "✓ Task Assigned Successfully" -ForegroundColor Green
    Write-Host "Status: $($assignResponse.data.status)"
} catch {
    Write-Host "✗ Assign Task Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Get Notifications
Write-Host "Test 9: Get Notifications" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $notificationsResponse = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headers
    Write-Host "✓ Get Notifications Passed" -ForegroundColor Green
    Write-Host "Total Notifications: $($notificationsResponse.data.Count)"
} catch {
    Write-Host "✗ Get Notifications Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 10: Get Task Statistics
Write-Host "Test 10: Get Task Statistics" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $goonToken" }
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/statistics" -Method Get -Headers $headers
    Write-Host "✓ Get Task Statistics Passed" -ForegroundColor Green
    Write-Host "Total Tasks: $($statsResponse.data.total)"
    Write-Host "Available: $($statsResponse.data.byStatus.available)"
    Write-Host "In Progress: $($statsResponse.data.byStatus.inProgress)"
} catch {
    Write-Host "✗ Get Task Statistics Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
