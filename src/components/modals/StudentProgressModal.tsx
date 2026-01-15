import { useState, useEffect } from 'react';
import { X, TrendingUp, Award, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tutorApi } from '@/lib/api';
import { format } from 'date-fns';

interface StudentProgressModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProgressModal({ studentId, studentName, isOpen, onClose }: StudentProgressModalProps) {
  const [grades, setGrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      loadGrades();
    }
  }, [isOpen, studentId]);

  const loadGrades = async () => {
    try {
      setIsLoading(true);
      const response = await tutorApi.getStudentGrades(Number(studentId));
      console.log('Grades response:', response); // Debug log
      setGrades(response.data || []);
      setStats(response.stats || {});
      console.log('Stats set:', response.stats); // Debug log
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (grade >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Report - {studentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getGradeColor(Number(stats.average_grade) || 0)}`}>
                    {stats.average_grade ? `${Math.round(Number(stats.average_grade))}%` : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_grades || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.highest_grade ? `${Math.round(Number(stats.highest_grade))}%` : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lowest Grade</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.lowest_grade ? `${Math.round(Number(stats.lowest_grade))}%` : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grades Table */}
            <Card>
              <CardHeader>
                <CardTitle>Grade History</CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No grades recorded yet.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grades.map((grade: any) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.assignment?.title || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {grade.class_model?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {grade.subject || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getGradeBadgeColor(grade.grade || 0)}>
                                {grade.grade ? `${Math.round(grade.grade)}%` : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {grade.created_at
                                ? format(new Date(grade.created_at), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

