import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Award, Calendar, Loader2 } from "lucide-react";
import { GradeDetailsModal } from '@/components/modals/GradeDetailsModal';
import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const StudentGrades = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [overallAverage, setOverallAverage] = useState(0);
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; subject: any }>({
    isOpen: false,
    subject: null,
  });

  useEffect(() => {
    const loadGrades = async () => {
      try {
        setIsLoading(true);
        const response = await studentApi.getGrades({ per_page: 100 });
        // The API returns { data: [...], overall_average: ..., pagination: {...} }
        if (response && response.data) {
          setGrades(Array.isArray(response.data) ? response.data : []);
          setOverallAverage(response.overall_average || 0);
        } else {
          setGrades([]);
          setOverallAverage(0);
        }
      } catch (error) {
        console.error('Failed to load grades:', error);
        toast({
          title: 'Error',
          description: 'Failed to load grades',
          variant: 'destructive',
        });
        setGrades([]);
        setOverallAverage(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadGrades();
  }, [toast]);

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
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

  // Group grades by subject/class
  const groupedGrades = grades.reduce((acc: any, grade: any) => {
    const key = grade.subject || grade.class_id || 'General';
    if (!acc[key]) {
      acc[key] = {
        subject: key,
        grades: [],
        average: 0,
      };
    }
    acc[key].grades.push(grade);
    return acc;
  }, {});

  // Calculate averages for each subject
  const subjectGrades = Object.values(groupedGrades).map((group: any) => {
    // Calculate percentage average based on grade/max_grade
    const totalPercentage = group.grades.reduce((sum: number, g: any) => {
      const grade = parseFloat(g.grade || 0);
      const maxGrade = parseFloat(g.max_grade || 1);
      return sum + (maxGrade > 0 ? (grade / maxGrade) * 100 : 0);
    }, 0);
    const avg = totalPercentage / group.grades.length;
    return {
      ...group,
      currentGrade: Math.round(avg),
      letterGrade: getLetterGrade(avg),
      credits: 3, // Default, would need to come from class data
    };
  });

  // Calculate stats from actual grades data
  const totalGrades = grades.length;
  const uniqueSubjects = new Set(grades.map((g: any) => g.subject || g.class_id || 'General')).size;
  
  const overallStats = {
    overallGrade: Math.round(overallAverage) || 0,
    completedAssignments: totalGrades,
    totalAssignments: totalGrades,
    subjects: uniqueSubjects,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.completedAssignments}
            </div>
            <p className="text-xs text-muted-foreground">Graded assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.subjects}
            </div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="timeline">Grade Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subjectGrades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No grades available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subjectGrades.map((subject, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {subject.subject}
                        </CardTitle>
                        <CardDescription>
                          {subject.credits} Credits
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
                        <h4 className="font-medium mb-3">Recent Grades</h4>
                        <div className="space-y-2">
                          {subject.grades.slice(-3).map((grade: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="space-y-0">
                                <p className="font-medium text-sm">{grade.assessment || grade.assignment?.title || 'Grade'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(grade.date || grade.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${getGradeColor(Math.round((parseFloat(grade.grade || 0) / parseFloat(grade.max_grade || 1)) * 100))}`}>
                                  {parseFloat(grade.grade || 0).toFixed(1)}/{parseFloat(grade.max_grade || 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round((parseFloat(grade.grade || 0) / parseFloat(grade.max_grade || 1)) * 100)}%
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
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Timeline</CardTitle>
              <CardDescription>Your academic performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : grades.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No grades available yet.</p>
              ) : (
                <div className="space-y-4">
                  {grades
                    .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
                    .slice(0, 10)
                    .map((grade, index) => (
                      <div key={grade.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{grade.assessment || grade.assignment?.title || 'Grade'}</h4>
                          <p className="text-sm text-muted-foreground">{grade.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(grade.date || grade.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className={`text-2xl font-bold ${getGradeColor(Math.round((parseFloat(grade.grade || 0) / parseFloat(grade.max_grade || 1)) * 100))}`}>
                            {Math.round((parseFloat(grade.grade || 0) / parseFloat(grade.max_grade || 1)) * 100)}%
                          </div>
                          <Badge variant="outline">
                            {parseFloat(grade.grade || 0).toFixed(1)}/{parseFloat(grade.max_grade || 0).toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
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