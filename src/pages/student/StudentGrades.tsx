import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Award, Calendar } from "lucide-react";
import { GradeDetailsModal } from '@/components/modals/GradeDetailsModal';
import { useState } from 'react';

const StudentGrades = () => {
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; subject: any }>({
    isOpen: false,
    subject: null,
  });
  const overallStats = {
    gpa: 3.4,
    overallGrade: 87,
    completedAssignments: 15,
    totalAssignments: 18,
    classRank: 8,
    totalStudents: 32
  };

  const subjectGrades = [
    {
      id: "1",
      subject: "Advanced Mathematics",
      tutor: "Mr. Smith",
      currentGrade: 92,
      credits: 4,
      letterGrade: "A-",
      trend: "up",
      assignments: [
        { name: "Quiz #1", grade: 95, maxGrade: 100, date: "2024-01-05" },
        { name: "Problem Set #1", grade: 88, maxGrade: 100, date: "2024-01-10" },
        { name: "Quiz #2", grade: 92, maxGrade: 100, date: "2024-01-15" },
        { name: "Midterm Exam", grade: 94, maxGrade: 100, date: "2024-01-20" }
      ]
    },
    {
      id: "2",
      subject: "Physics Fundamentals", 
      tutor: "Dr. Johnson",
      currentGrade: 85,
      credits: 3,
      letterGrade: "B+",
      trend: "stable",
      assignments: [
        { name: "Lab Report #1", grade: 87, maxGrade: 100, date: "2024-01-08" },
        { name: "Quiz #1", grade: 82, maxGrade: 100, date: "2024-01-12" },
        { name: "Lab Report #2", grade: 89, maxGrade: 100, date: "2024-01-18" }
      ]
    },
    {
      id: "3",
      subject: "English Literature",
      tutor: "Ms. Williams", 
      currentGrade: 88,
      credits: 3,
      letterGrade: "B+",
      trend: "up",
      assignments: [
        { name: "Essay #1", grade: 85, maxGrade: 100, date: "2024-01-07" },
        { name: "Poetry Analysis", grade: 92, maxGrade: 100, date: "2024-01-14" },
        { name: "Book Report", grade: 87, maxGrade: 100, date: "2024-01-21" }
      ]
    },
    {
      id: "4",
      subject: "Computer Science",
      tutor: "Prof. Davis",
      currentGrade: 79,
      credits: 4,
      letterGrade: "C+", 
      trend: "down",
      assignments: [
        { name: "Programming Quiz", grade: 75, maxGrade: 100, date: "2024-01-06" },
        { name: "Project #1", grade: 82, maxGrade: 100, date: "2024-01-13" },
        { name: "Midterm Exam", grade: 78, maxGrade: 100, date: "2024-01-19" }
      ]
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getLetterGradeColor = (letterGrade: string) => {
    if (letterGrade.startsWith('A')) return "bg-green-500";
    if (letterGrade.startsWith('B')) return "bg-blue-500";
    if (letterGrade.startsWith('C')) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
          <p className="text-muted-foreground">
            Track your grades and academic progress
          </p>
        </div>
      </div>

      {/* Overall Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.gpa}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.overallGrade}%</div>
            <Progress value={overallStats.overallGrade} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.completedAssignments}/{overallStats.totalAssignments}
            </div>
            <p className="text-xs text-muted-foreground">Completed this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{overallStats.classRank}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {overallStats.totalStudents} students
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="timeline">Grade Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {subjectGrades.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {subject.subject}
                        {getTrendIcon(subject.trend)}
                      </CardTitle>
                      <CardDescription>
                        {subject.tutor} • {subject.credits} Credits
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-3xl font-bold ${getGradeColor(subject.currentGrade)}`}>
                        {subject.currentGrade}%
                      </div>
                      <Badge 
                        className={`${getLetterGradeColor(subject.letterGrade)} text-white border-0`}
                      >
                        {subject.letterGrade}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Course Progress</span>
                        <span>{subject.currentGrade}%</span>
                      </div>
                      <Progress value={subject.currentGrade} className="h-2" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Recent Assignments</h4>
                      <div className="space-y-2">
                        {subject.assignments.slice(-3).map((assignment, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="space-y-0">
                              <p className="font-medium text-sm">{assignment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(assignment.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${getGradeColor(assignment.grade)}`}>
                                {assignment.grade}/{assignment.maxGrade}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((assignment.grade / assignment.maxGrade) * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDetailsModal({ isOpen: true, subject })}
                      className="mt-4"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Timeline</CardTitle>
              <CardDescription>Your academic performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectGrades.flatMap(subject => 
                  subject.assignments.map(assignment => ({
                    ...assignment,
                    subject: subject.subject,
                    tutor: subject.tutor
                  }))
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{assignment.name}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(assignment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-2xl font-bold ${getGradeColor(assignment.grade)}`}>
                        {assignment.grade}%
                      </div>
                      <Badge variant="outline">
                        {assignment.grade}/{assignment.maxGrade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Details Modal */}
      <GradeDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, subject: null })}
        subject={detailsModal.subject}
      />
    </div>
  );
};

export default StudentGrades;