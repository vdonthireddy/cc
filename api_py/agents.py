import json
from .llm import llm
from .database import execute_query

async def run_opportunity_scout(student_id: int):
    """
    Agent that analyzes a student's profile and suggests new activities.
    """
    student = execute_query("SELECT * FROM Student WHERE id = %s", (student_id,), fetch_one=True)
    if not student: return {"error": "Student not found"}
    
    # Fetch academic and existing EC context
    academics = execute_query("SELECT courseName, grade FROM AcademicRecord WHERE studentId = %s", (student_id,))
    ecs = execute_query("SELECT name, role FROM Extracurricular WHERE studentId = %s", (student_id,))
    
    context = {
        "interest": student.get("majorInterest"),
        "grade": student.get("grade"),
        "current_ecs": [e["name"] for e in ecs],
        "academics": [a["courseName"] for a in academics]
    }
    
    prompt = f"""
    Context: {json.dumps(context)}
    
    Goal: As a college counselor, suggest 3 specific and high-impact extracurricular activities
    for this student to pursue next. Briefly explain why for each.
    """
    
    response = await llm.generate_content(prompt)
    return {"suggestions": response}

async def generate_academic_roadmap(student_id: int):
    """
    Agent that builds a 4-year high school course plan.
    """
    student = execute_query("SELECT grade, majorInterest FROM Student WHERE id = %s", (student_id,), fetch_one=True)
    if not student: return []
    
    prompt = f"""
    Grade: {student['grade']}, Interest: {student['majorInterest']}
    
    Task: Create a 4-year high school course roadmap (9-12). 
    Provide it ONLY as a JSON array of objects: {{"year": int, "courses": [str]}}.
    Include 5-7 courses per year.
    """
    
    response = await llm.generate_content(prompt)
    try:
        # Surgical extraction of JSON if model returns extra text
        clean_json = response[response.find('['):response.rfind(']')+1]
        return json.loads(clean_json)
    except:
        return []

async def get_interview_feedback(student_id: int, question: str, answer: str):
    """
    Agent that acts as an interview coach.
    """
    student = execute_query("SELECT majorInterest FROM Student WHERE id = %s", (student_id,), fetch_one=True)
    interest = student['majorInterest'] if student else "General"
    
    prompt = f"""
    You are an expert college admissions interviewer.
    Student Interest: {interest}
    Question asked: {question}
    Student Answer: {answer}
    
    Task: Provide brief, constructive feedback. Tell them what they did well and one specific 
    way to improve their answer. Keep it encouraging but professional.
    """
    
    response = await llm.generate_content(prompt)
    return {"feedback": response, "model_name": llm.get_model_name()}
