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

  const averageGrade = subject.assignments.reduce((sum: number, assignment: any) => 
    sum + (assignment.grade / assignment.maxGrade * 100), 0) / subject.assignments.length;

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
                <div className="text-lg font-medium">{subject.tutor}</div>
                <div className="text-sm text-muted-foreground">{subject.credits} Credits</div>
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
                <div className="text-lg font-medium capitalize">{subject.trend}ward</div>
                <div className="text-sm text-muted-foreground">
                  Based on recent assignments
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

          {/* Detailed Assignment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subject.assignments.map((assignment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{assignment.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-xl font-bold ${getGradeColor((assignment.grade / assignment.maxGrade) * 100)}`}>
                        {assignment.grade}/{assignment.maxGrade}
                      </div>
                      <Badge variant="outline">
                        {Math.round((assignment.grade / assignment.maxGrade) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Highest Grade:</span>
                  <span className="font-medium text-green-600">
                    {Math.max(...subject.assignments.map((a: any) => Math.round((a.grade / a.maxGrade) * 100)))}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lowest Grade:</span>
                  <span className="font-medium text-red-600">
                    {Math.min(...subject.assignments.map((a: any) => Math.round((a.grade / a.maxGrade) * 100)))}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average:</span>
                  <span className={`font-medium ${getGradeColor(averageGrade)}`}>
                    {Math.round(averageGrade)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Assignments:</span>
                  <span className="font-medium">{subject.assignments.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['A (90-100%)', 'B (80-89%)', 'C (70-79%)', 'D (60-69%)', 'F (0-59%)'].map((range, index) => {
                    const grades = subject.assignments.map((a: any) => Math.round((a.grade / a.maxGrade) * 100));
                    const count = grades.filter((grade: number) => {
                      if (index === 0) return grade >= 90;
                      if (index === 1) return grade >= 80 && grade < 90;
                      if (index === 2) return grade >= 70 && grade < 80;
                      if (index === 3) return grade >= 60 && grade < 70;
                      return grade < 60;
                    }).length;
                    
                    return (
                      <div key={range} className="flex items-center justify-between text-sm">
                        <span>{range}</span>
                        <span className="font-medium">{count} assignments</span>
                      </div>
                    );
                  })}
                </div>
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