import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, BarChart3, Calendar, Award, Star, User } from "lucide-react";

interface GradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: any;
}

export const GradeDetailsModal: React.FC<GradeDetailsModalProps> = ({
  isOpen,
  onClose,
  subject
}) => {
  if (!subject) return null;

  // Use grades array instead of assignments, with fallback to empty array
  const grades = subject.grades || [];
  const hasGrades = grades.length > 0;

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

  const averageGrade = hasGrades 
    ? grades.reduce((sum: number, gradeItem: any) => {
        const grade = parseFloat(gradeItem.grade || 0);
        const maxGrade = parseFloat(gradeItem.max_grade || 1);
        return sum + (maxGrade > 0 ? (grade / maxGrade) * 100 : 0);
      }, 0) / grades.length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Grade Details - {subject.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subject Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Current Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getGradeColor(subject.currentGrade)}`}>
                  {subject.currentGrade}%
                </div>
                <Badge className={`${getLetterGradeColor(subject.letterGrade)} text-white border-0 mt-2`}>
                  {subject.letterGrade}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">{subject.tutor || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{subject.credits || 0} Credits</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {getTrendIcon(subject.trend)}
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium capitalize">{subject.trend ? `${subject.trend}ward` : 'Stable'}</div>
                <div className="text-sm text-muted-foreground">
                  Based on recent grades
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Performance</span>
                  <span>{subject.currentGrade}%</span>
                </div>
                <Progress value={subject.currentGrade} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Grade Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grade Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasGrades ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No grades available for this subject.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grades.map((gradeItem: any, index: number) => {
                    const grade = parseFloat(gradeItem.grade || 0);
                    const maxGrade = parseFloat(gradeItem.max_grade || 1);
                    const percentage = maxGrade > 0 ? (grade / maxGrade) * 100 : 0;
                    const gradeDate = gradeItem.date || gradeItem.created_at;
                    
                    return (
                      <div key={gradeItem.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-medium">{gradeItem.assessment || gradeItem.assignment?.title || 'Grade'}</h4>
                          {gradeItem.category && (
                            <Badge variant="outline" className="text-xs">
                              {gradeItem.category}
                            </Badge>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {gradeDate ? new Date(gradeDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          {gradeItem.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{gradeItem.notes}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className={`text-xl font-bold ${getGradeColor(percentage)}`}>
                            {grade.toFixed(1)}/{maxGrade.toFixed(1)}
                          </div>
                          <Badge variant="outline">
                            {Math.round(percentage)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasGrades ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Highest Grade:</span>
                      <span className="font-medium text-green-600">
                        {Math.max(...grades.map((g: any) => {
                          const grade = parseFloat(g.grade || 0);
                          const maxGrade = parseFloat(g.max_grade || 1);
                          return Math.round(maxGrade > 0 ? (grade / maxGrade) * 100 : 0);
                        }))}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Lowest Grade:</span>
                      <span className="font-medium text-red-600">
                        {Math.min(...grades.map((g: any) => {
                          const grade = parseFloat(g.grade || 0);
                          const maxGrade = parseFloat(g.max_grade || 1);
                          return Math.round(maxGrade > 0 ? (grade / maxGrade) * 100 : 0);
                        }))}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average:</span>
                      <span className={`font-medium ${getGradeColor(averageGrade)}`}>
                        {Math.round(averageGrade)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Grades:</span>
                      <span className="font-medium">{grades.length}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No grades available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {hasGrades ? (
                  <div className="space-y-2">
                    {['A (90-100%)', 'B (80-89%)', 'C (70-79%)', 'D (60-69%)', 'F (0-59%)'].map((range, index) => {
                      const gradePercentages = grades.map((g: any) => {
                        const grade = parseFloat(g.grade || 0);
                        const maxGrade = parseFloat(g.max_grade || 1);
                        return Math.round(maxGrade > 0 ? (grade / maxGrade) * 100 : 0);
                      });
                      const count = gradePercentages.filter((grade: number) => {
                        if (index === 0) return grade >= 90;
                        if (index === 1) return grade >= 80 && grade < 90;
                        if (index === 2) return grade >= 70 && grade < 80;
                        if (index === 3) return grade >= 60 && grade < 70;
                        return grade < 60;
                      }).length;
                      
                      return (
                        <div key={range} className="flex items-center justify-between text-sm">
                          <span>{range}</span>
                          <span className="font-medium">{count} {count === 1 ? 'grade' : 'grades'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No grade distribution available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Download Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};