
def calculate_weighted_gpa(records):
    """
    Consistently calculate weighted GPA across the application.
    AP courses get +1.0 weight, Honors get +0.5 weight.
    """
    grade_points = {
        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
    }
    total_points = 0.0
    total_credits = 0.0
    for r in records:
        base = grade_points.get(r.get("grade") or "", 0.0)
        # Use .get() or index depending on if it's a dict or object
        # In our case execute_query returns dicts
        is_ap = r.get("isAP") or r.get("is_ap") or False
        is_honors = r.get("isHonors") or r.get("is_honors") or False
        credits = r.get("credits") or 1.0
        
        weight = 1.0 if is_ap else (0.5 if is_honors else 0.0)
        total_points += (base + weight) * credits
        total_credits += credits
        
    return round(total_points / total_credits, 2) if total_credits > 0 else 0.0

# SQL snippet for weighted GPA calculation - to be used in SELECT subqueries
# Requires 'grade', 'isAP', 'isHonors', 'credits' in AcademicRecord
GPA_SQL_SNIPPET = """
    (SELECT ROUND(
        SUM(
            (CASE grade 
                WHEN 'A' THEN 4.0 WHEN 'A-' THEN 3.7 WHEN 'B+' THEN 3.3 
                WHEN 'B' THEN 3.0 WHEN 'B-' THEN 2.7 WHEN 'C+' THEN 2.3 
                WHEN 'C' THEN 2.0 WHEN 'C-' THEN 1.7 WHEN 'D+' THEN 1.3
                WHEN 'D' THEN 1.0 WHEN 'F' THEN 0.0 ELSE 0 END 
             + CASE WHEN isAP THEN 1.0 WHEN isHonors THEN 0.5 ELSE 0 END) 
            * IFNULL(credits, 1.0)
        ) / SUM(IFNULL(credits, 1.0)), 
        2)
    FROM AcademicRecord WHERE studentId = s.id)
"""
