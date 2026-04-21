import random

# Configuration
NUM_COUNSELORS = 5
NUM_PARENTS = 10
NUM_STUDENTS = 50
COURSES_PER_STUDENT = 10

courses = [
    "Algebra II", "English 9", "Biology", "Spanish I", "World History",
    "Pre-Calculus", "English 10", "Chemistry", "Spanish II", "AP World History",
    "AP Calculus AB", "AP Physics 1", "English 11 AP Lang", "Spanish III", "AP US History",
    "AP Calculus BC", "AP Physics C", "English 12 AP Lit", "Spanish IV", "AP Gov/Econ"
]
grades = ["A", "A-", "B+", "B", "B-", "C+", "C"]

def generate_sql():
    sql = ["-- Large Scale Seed Script", "SET FOREIGN_KEY_CHECKS = 0;", 
           "TRUNCATE TABLE `User`;", "TRUNCATE TABLE `Student`;", 
           "TRUNCATE TABLE `AcademicRecord`;", "TRUNCATE TABLE `StudentParent`;",
           "SET FOREIGN_KEY_CHECKS = 1;"]

    # 1. Admin
    sql.append("INSERT INTO `User` (id, email, role, name, passwordHash) VALUES (1, 'admin@pathfinder.com', 'ADMIN', 'Demo Admin', 'abc123');")

    # 2. Counselors (IDs 2-6)
    for i in range(2, 2 + NUM_COUNSELORS):
        sql.append(f"INSERT INTO `User` (id, email, role, name, passwordHash) VALUES ({i}, 'counselor{i-1}@pathfinder.com', 'COUNSELOR', 'Counselor {i-1}', 'abc123');")

    # 3. Parents (IDs 7-16)
    for i in range(7, 7 + NUM_PARENTS):
        sql.append(f"INSERT INTO `User` (id, email, role, name, passwordHash) VALUES ({i}, 'parent{i-6}@pathfinder.com', 'PARENT', 'Parent {i-6}', 'abc123');")

    # 4. Students (IDs 17-66)
    for i in range(17, 17 + NUM_STUDENTS):
        cid = random.randint(2, 2 + NUM_COUNSELORS - 1)
        grade_level = random.randint(9, 12)
        sql.append(f"INSERT INTO `User` (id, email, role, name, passwordHash) VALUES ({i}, 'student{i-16}@pathfinder.com', 'STUDENT', 'Student {i-16}', 'abc123');")
        sql.append(f"INSERT INTO `Student` (id, userId, grade, zipCode, majorInterest, counselorId) VALUES ({i-16}, {i}, {grade_level}, '90210', 'CS', {cid});")

    # 5. Link Parents to Students
    for i in range(1, NUM_STUDENTS + 1):
        pid = random.randint(7, 7 + NUM_PARENTS - 1)
        sql.append(f"INSERT INTO `StudentParent` (studentId, parentId, permissions) VALUES ({i}, {pid}, '{{\"viewGrades\":true}}');")

    # 6. Academic Records
    record_id = 1
    for i in range(1, NUM_STUDENTS + 1):
        used_courses = random.sample(courses, COURSES_PER_STUDENT)
        for course in used_courses:
            grade = random.choice(grades)
            is_ap = 1 if "AP" in course else 0
            is_honors = 1 if "Honors" in course else 0
            year = random.randint(2021, 2024)
            sql.append(f"INSERT INTO `AcademicRecord` (id, studentId, courseName, grade, credits, semester, year, isAP, isHonors) VALUES ({record_id}, {i}, '{course}', '{grade}', 1.0, 'Fall', {year}, {is_ap}, {is_honors});")
            record_id += 1

    # 7. Initial System Config
    sql.append("INSERT INTO `SystemConfig` (id, encryptionKey, agentConfig, featureFlags) VALUES (1, 'demo-key-large', '{\"scout\":{\"enabled\":true}}', '{\"scholarships\":true}');")

    return "\n".join(sql)

if __name__ == "__main__":
    with open("demo/seed_large.sql", "w") as f:
        f.write(generate_sql())
    print("Large seed SQL generated at demo/seed_large.sql")
