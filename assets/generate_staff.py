import csv
import random

first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Paul", "Betty", "Mark", "Margaret", "Donald", "Sandra"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

departments = ["Housekeeping", "Maintenance", "Front Desk", "Security", "Food & Beverage", "Management", "Landscaping"]
ranks = ["Entry", "Regular", "Senior", "Supervisor", "Manager"]
statuses = ["Active", "Active", "Active", "Active", "Leave"]

with open('/Users/johndiddles/Desktop/srb/srb/assets/sample_staff.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Staff ID', 'First Name', 'Last Name', 'Department', 'Rank', 'Status'])
    
    for i in range(50):
        first = random.choice(first_names)
        last = random.choice(last_names)
        dept = random.choice(departments)
        
        # Managers usually fewer
        rank_pool = ranks if dept != "Management" else ["Manager"]
        rank = random.choice(rank_pool)
        
        status = random.choice(statuses)
        staff_id = f"STF{1000 + i}"
        
        writer.writerow([
            staff_id,
            first,
            last,
            dept,
            rank,
            status
        ])

print("Staff CSV generated successfully at /Users/johndiddles/Desktop/srb/srb/assets/sample_staff.csv")
