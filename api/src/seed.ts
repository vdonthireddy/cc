import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const colleges = [
  { name: 'Harvard University', location: 'Cambridge, MA', sat25th: 1460, sat75th: 1580, act25th: 33, act75th: 35, acceptRate: 0.04 },
  { name: 'Stanford University', location: 'Stanford, CA', sat25th: 1440, sat75th: 1570, act25th: 32, act75th: 35, acceptRate: 0.04 },
  { name: 'Massachusetts Institute of Technology', location: 'Cambridge, MA', sat25th: 1510, sat75th: 1580, act25th: 34, act75th: 36, acceptRate: 0.04 },
  { name: 'Yale University', location: 'New Haven, CT', sat25th: 1460, sat75th: 1580, act25th: 33, act75th: 35, acceptRate: 0.05 },
  { name: 'Princeton University', location: 'Princeton, NJ', sat25th: 1450, sat75th: 1570, act25th: 32, act75th: 35, acceptRate: 0.04 },
  { name: 'California Institute of Technology', location: 'Pasadena, CA', sat25th: 1530, sat75th: 1580, act25th: 35, act75th: 36, acceptRate: 0.04 },
  { name: 'Columbia University', location: 'New York, NY', sat25th: 1460, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.04 },
  { name: 'University of Chicago', location: 'Chicago, IL', sat25th: 1500, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.05 },
  { name: 'University of Pennsylvania', location: 'Philadelphia, PA', sat25th: 1460, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.06 },
  { name: 'Johns Hopkins University', location: 'Baltimore, MD', sat25th: 1470, sat75th: 1560, act25th: 33, act75th: 35, acceptRate: 0.07 },
  { name: 'Duke University', location: 'Durham, NC', sat25th: 1470, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.06 },
  { name: 'Northwestern University', location: 'Evanston, IL', sat25th: 1460, sat75th: 1560, act25th: 33, act75th: 35, acceptRate: 0.07 },
  { name: 'Dartmouth College', location: 'Hanover, NH', sat25th: 1440, sat75th: 1560, act25th: 32, act75th: 35, acceptRate: 0.06 },
  { name: 'Brown University', location: 'Providence, RI', sat25th: 1440, sat75th: 1560, act25th: 32, act75th: 35, acceptRate: 0.05 },
  { name: 'Vanderbilt University', location: 'Nashville, TN', sat25th: 1470, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.07 },
  { name: 'Rice University', location: 'Houston, TX', sat25th: 1460, sat75th: 1570, act25th: 33, act75th: 35, acceptRate: 0.09 },
  { name: 'Washington University in St. Louis', location: 'St. Louis, MO', sat25th: 1480, sat75th: 1560, act25th: 33, act75th: 35, acceptRate: 0.10 },
  { name: 'Cornell University', location: 'Ithaca, NY', sat25th: 1400, sat75th: 1540, act25th: 32, act75th: 35, acceptRate: 0.09 },
  { name: 'Notre Dame University', location: 'Notre Dame, IN', sat25th: 1400, sat75th: 1550, act25th: 32, act75th: 35, acceptRate: 0.13 },
  { name: 'University of California, Berkeley', location: 'Berkeley, CA', sat25th: 1300, sat75th: 1530, act25th: 28, act75th: 34, acceptRate: 0.11 },
  { name: 'University of California, Los Angeles', location: 'Los Angeles, CA', sat25th: 1290, sat75th: 1520, act25th: 29, act75th: 34, acceptRate: 0.09 },
  { name: 'Emory University', location: 'Atlanta, GA', sat25th: 1380, sat75th: 1530, act25th: 31, act75th: 34, acceptRate: 0.13 },
  { name: 'Georgetown University', location: 'Washington, DC', sat25th: 1380, sat75th: 1550, act25th: 31, act75th: 35, acceptRate: 0.12 },
  { name: 'Carnegie Mellon University', location: 'Pittsburgh, PA', sat25th: 1460, sat75th: 1560, act25th: 33, act75th: 35, acceptRate: 0.11 },
  { name: 'University of Michigan', location: 'Ann Arbor, MI', sat25th: 1340, sat75th: 1530, act25th: 31, act75th: 34, acceptRate: 0.18 },
  { name: 'University of Virginia', location: 'Charlottesville, VA', sat25th: 1320, sat75th: 1510, act25th: 30, act75th: 34, acceptRate: 0.19 },
  { name: 'University of Southern California', location: 'Los Angeles, CA', sat25th: 1330, sat75th: 1520, act25th: 30, act75th: 34, acceptRate: 0.12 },
  { name: 'New York University', location: 'New York, NY', sat25th: 1370, sat75th: 1540, act25th: 31, act75th: 34, acceptRate: 0.12 },
  { name: 'Tufts University', location: 'Medford, MA', sat25th: 1420, sat75th: 1550, act25th: 32, act75th: 35, acceptRate: 0.10 },
  { name: 'University of North Carolina at Chapel Hill', location: 'Chapel Hill, NC', sat25th: 1300, sat75th: 1500, act25th: 28, act75th: 34, acceptRate: 0.17 },
  { name: 'Wake Forest University', location: 'Winston-Salem, NC', sat25th: 1300, sat75th: 1480, act25th: 30, act75th: 33, acceptRate: 0.20 },
  { name: 'UC Santa Barbara', location: 'Santa Barbara, CA', sat25th: 1230, sat75th: 1480, act25th: 26, act75th: 33, acceptRate: 0.26 },
  { name: 'University of Florida', location: 'Gainesville, FL', sat25th: 1290, sat75th: 1460, act25th: 29, act75th: 33, acceptRate: 0.23 },
  { name: 'Boston College', location: 'Chestnut Hill, MA', sat25th: 1330, sat75th: 1500, act25th: 31, act75th: 34, acceptRate: 0.17 },
  { name: 'Georgia Institute of Technology', location: 'Atlanta, GA', sat25th: 1370, sat75th: 1530, act25th: 31, act75th: 35, acceptRate: 0.17 },
  { name: 'UC Irvine', location: 'Irvine, CA', sat25th: 1170, sat75th: 1420, act25th: 24, act75th: 33, acceptRate: 0.21 },
  { name: 'UC San Diego', location: 'La Jolla, CA', sat25th: 1260, sat75th: 1480, act25th: 26, act75th: 33, acceptRate: 0.24 },
  { name: 'University of Rochester', location: 'Rochester, NY', sat25th: 1310, sat75th: 1500, act25th: 30, act75th: 34, acceptRate: 0.39 },
  { name: 'University of Texas at Austin', location: 'Austin, TX', sat25th: 1210, sat75th: 1470, act25th: 26, act75th: 33, acceptRate: 0.31 },
  { name: 'University of Wisconsin-Madison', location: 'Madison, WI', sat25th: 1260, sat75th: 1460, act25th: 27, act75th: 32, acceptRate: 0.49 },
  { name: 'Boston University', location: 'Boston, MA', sat25th: 1310, sat75th: 1500, act25th: 30, act75th: 34, acceptRate: 0.14 },
  { name: 'University of Illinois Urbana-Champaign', location: 'Champaign, IL', sat25th: 1210, sat75th: 1470, act25th: 26, act75th: 33, acceptRate: 0.45 },
  { name: 'College of William & Mary', location: 'Williamsburg, VA', sat25th: 1300, sat75th: 1490, act25th: 30, act75th: 34, acceptRate: 0.33 },
  { name: 'Brandeis University', location: 'Waltham, MA', sat25th: 1320, sat75th: 1510, act25th: 30, act75th: 33, acceptRate: 0.39 },
  { name: 'Case Western Reserve University', location: 'Cleveland, OH', sat25th: 1340, sat75th: 1510, act25th: 30, act75th: 34, acceptRate: 0.27 },
  { name: 'Northeastern University', location: 'Boston, MA', sat25th: 1410, sat75th: 1540, act25th: 33, act75th: 35, acceptRate: 0.07 },
  { name: 'Tulane University', location: 'New Orleans, LA', sat25th: 1340, sat75th: 1500, act25th: 30, act75th: 33, acceptRate: 0.10 },
  { name: 'University of Georgia', location: 'Athens, GA', sat25th: 1220, sat75th: 1420, act25th: 27, act75th: 32, acceptRate: 0.40 },
  { name: 'The Ohio State University', location: 'Columbus, OH', sat25th: 1210, sat75th: 1430, act25th: 26, act75th: 32, acceptRate: 0.53 },
  { name: 'Purdue University', location: 'West Lafayette, IN', sat25th: 1190, sat75th: 1430, act25th: 25, act75th: 33, acceptRate: 0.53 },
  { name: 'Villanova University', location: 'Villanova, PA', sat25th: 1320, sat75th: 1470, act25th: 31, act75th: 34, acceptRate: 0.23 },
  { name: 'Lehigh University', location: 'Bethlehem, PA', sat25th: 1280, sat75th: 1450, act25th: 29, act75th: 33, acceptRate: 0.37 },
  { name: 'Pepperdine University', location: 'Malibu, CA', sat25th: 1210, sat75th: 1420, act25th: 26, act75th: 32, acceptRate: 0.53 },
  { name: 'Rensselaer Polytechnic Institute', location: 'Troy, NY', sat25th: 1290, sat75th: 1490, act25th: 28, act75th: 34, acceptRate: 0.53 }
];

const scholarships = [
  { name: 'Academic Excellence Scholarship', amount: 10000, minGpa: 3.5, description: 'For students with outstanding academic records.' },
  { name: 'STEM Innovators Grant', amount: 5000, minGpa: 3.0, description: 'For students pursuing degrees in STEM fields.' },
  { name: 'Community Leadership Award', amount: 2500, minGpa: 2.5, description: 'For students who show exceptional leadership in their community.' },
  { name: 'Future Educators Scholarship', amount: 3000, minGpa: 3.0, description: 'For students planning to become teachers.' },
  { name: 'Arts and Humanities Grant', amount: 4000, minGpa: 3.0, description: 'For students excelling in the arts or humanities.' },
];

for (let i = 6; i <= 50; i++) {
  scholarships.push({
    name: `Scholarship ${i}`,
    amount: Math.floor(Math.random() * 5000) + 1000,
    minGpa: parseFloat((Math.random() * 1.5 + 2.5).toFixed(1)),
    description: `Automated scholarship description for scholarship ${i}.`,
  });
}

async function main() {
  console.log('Start seeding...');
  
  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();
  await prisma.scholarship.deleteMany();

  const passwordHash = await argon2.hash('password123');

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      passwordHash,
    }
  });

  // 1 Counselor
  const counselor = await prisma.user.create({
    data: {
      email: 'counselor@example.com',
      name: 'John Counselor',
      role: 'counselor',
      passwordHash,
    }
  });

  // 3 Students
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `student${i}@example.com`,
        name: `Student ${i}`,
        role: 'student',
        passwordHash,
      }
    });
    
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        grade: 10 + i,
        zipCode: '12345',
        counselorId: counselor.id,
      }
    });
    students.push(student);

    // Add some academic records
    await prisma.academicRecord.create({
        data: {
            studentId: student.id,
            courseName: 'Mathematics',
            grade: 'A',
            credits: 1.0,
            semester: 'Fall',
            year: 2023,
        }
    });
  }

  // 2 Parents
  for (let i = 1; i <= 2; i++) {
    const parent = await prisma.user.create({
      data: {
        email: `parent${i}@example.com`,
        name: `Parent ${i}`,
        role: 'parent',
        passwordHash,
      }
    });
    
    // Link parent to a student (Parent 1 to Student 1, Parent 2 to Student 2)
    if (students[i-1]) {
        await prisma.studentParent.create({
            data: {
                studentId: students[i-1].id,
                parentId: parent.id,
            }
        });
    }
  }

  for (const college of colleges) {
    await prisma.college.create({
      data: college,
    });
  }

  for (const scholarship of scholarships) {
    await prisma.scholarship.create({
      data: scholarship,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
